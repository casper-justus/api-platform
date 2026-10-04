use axum::{
    extract::DefaultBodyLimit,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{env, net::SocketAddr};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[derive(Serialize)]
struct ApiResponse<T> {
    data: T,
    meta: ResponseMeta,
}

#[derive(Serialize)]
struct ResponseMeta {
    service: &'static str,
    version: &'static str,
}

impl<T> ApiResponse<T> {
    fn new(data: T) -> Self {
        Self {
            data,
            meta: ResponseMeta {
                service: "api-platform-rust",
                version: env!("CARGO_PKG_VERSION"),
            },
        }
    }
}

#[derive(Serialize)]
struct ServiceStatus {
    status: &'static str,
}

#[derive(Deserialize)]
struct TextRequest {
    text: String,
}

#[derive(Serialize)]
struct TextAnalysis {
    characters: usize,
    words: usize,
    lines: usize,
    bytes: usize,
}

#[derive(Serialize)]
struct Slug {
    slug: String,
}

#[derive(Serialize)]
struct ApiError {
    error: ErrorDetails,
}

#[derive(Serialize)]
struct ErrorDetails {
    code: &'static str,
    message: &'static str,
}

async fn health() -> Json<ApiResponse<ServiceStatus>> {
    Json(ApiResponse::new(ServiceStatus { status: "ok" }))
}

async fn analyze(Json(input): Json<TextRequest>) -> Result<Json<ApiResponse<TextAnalysis>>, ApiFailure> {
    if input.text.trim().is_empty() {
        return Err(ApiFailure::bad_request("Text must not be empty"));
    }

    let lines = input.text.lines().count();
    Ok(Json(ApiResponse::new(TextAnalysis {
        characters: input.text.chars().count(),
        words: input.text.split_whitespace().count(),
        lines,
        bytes: input.text.len(),
    })))
}

async fn slugify(Json(input): Json<TextRequest>) -> Result<Json<ApiResponse<Slug>>, ApiFailure> {
    if input.text.trim().is_empty() {
        return Err(ApiFailure::bad_request("Text must not be empty"));
    }

    let mut slug = String::new();
    let mut separator = false;
    for character in input.text.trim().chars().flat_map(char::to_lowercase) {
        if character.is_alphanumeric() {
            if separator && !slug.is_empty() {
                slug.push('-');
            }
            slug.push(character);
            separator = false;
        } else {
            separator = true;
        }
    }

    if slug.is_empty() {
        return Err(ApiFailure::bad_request("Text contains no letters or digits"));
    }

    Ok(Json(ApiResponse::new(Slug { slug })))
}

struct ApiFailure {
    status: StatusCode,
    code: &'static str,
    message: &'static str,
}

impl ApiFailure {
    fn bad_request(message: &'static str) -> Self {
        Self { status: StatusCode::BAD_REQUEST, code: "INVALID_INPUT", message }
    }
}

impl IntoResponse for ApiFailure {
    fn into_response(self) -> Response {
        (self.status, Json(ApiError { error: ErrorDetails { code: self.code, message: self.message } })).into_response()
    }
}

#[tokio::main]
async fn main() {
    let port = env::var("RUST_API_PORT")
        .or_else(|_| env::var("PORT"))
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(3001);
    let address = SocketAddr::from(([0, 0, 0, 0], port));

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/v1/text/analyze", post(analyze))
        .route("/api/v1/text/slugify", post(slugify))
        .layer(DefaultBodyLimit::max(64 * 1024))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(address).await.expect("bind Rust API listener");
    eprintln!("Rust utility API listening on http://{address}");
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await
        .expect("serve Rust API");
}

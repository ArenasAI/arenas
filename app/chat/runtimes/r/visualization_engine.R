library(ggplot2)
library(plotly)
library(jsonlite)
library(base64enc)

# Main visualization function
create_visualization <- function(df, viz_type, params = list()) {
  tryCatch({
    plot <- switch(viz_type,
      "histogram" = create_histogram(df, params),
      "scatter" = create_scatter(df, params),
      "line" = create_line(df, params),
      "heatmap" = create_heatmap(df, params),
      "box" = create_box(df, params),
      stop(paste("Unsupported visualization type:", viz_type))
    )
    
    # Convert to plotly if not already
    if ("ggplot" %in% class(plot)) {
      plot <- ggplotly(plot)
    }
    
    # Convert to JSON
    list(plotly_json = plotly_json(plot))
    
  }, error = function(e) {
    list(error = as.character(e))
  })
}

create_histogram <- function(df, params) {
  column <- params$column
  if (is.null(column)) {
    column <- names(select_if(df, is.numeric))[1]
  }
  
  ggplot(df, aes_string(x = column)) +
    geom_histogram(fill = "steelblue", alpha = 0.7) +
    theme_minimal() +
    labs(title = paste("Histogram of", column))
}

create_scatter <- function(df, params) {
  x <- params$x
  y <- params$y
  
  if (is.null(x) || is.null(y)) {
    numeric_cols <- names(select_if(df, is.numeric))
    x <- numeric_cols[1]
    y <- numeric_cols[2]
  }
  
  ggplot(df, aes_string(x = x, y = y)) +
    geom_point(alpha = 0.6) +
    theme_minimal() +
    labs(title = paste("Scatter plot:", x, "vs", y))
}

create_line <- function(df, params) {
  x <- params$x
  y <- params$y
  

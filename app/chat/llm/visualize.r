library(ggplot2)
library(tidyr)
library(dplyr)
library(plotly)
library(corrplot)

create_visualizations <- function(data) {
  # Time Series Plot
  if ("date" %in% colnames(data)) {
    p1 <- ggplot(data, aes(x = date, y = value)) +
      geom_line() +
      theme_minimal() +
      labs(title = "Time Series Analysis")
    ggsave("time_series.png", p1)
  }
  
  # Advanced Correlation Matrix
  numeric_data <- data %>% select_if(is.numeric)
  corr_matrix <- cor(numeric_data)
  png("correlation_matrix.png")
  corrplot(corr_matrix, method = "color", addCoef.col = "black", type = "upper")
  dev.off()
  
  # Distribution Analysis
  p2 <- numeric_data %>%
    gather() %>%
    ggplot(aes(x = value)) +
    geom_density(fill = "blue", alpha = 0.5) +
    facet_wrap(~key, scales = "free") +
    theme_minimal() +
    labs(title = "Distribution Analysis")
  ggsave("distributions.png", p2)
  
  # Box Plot with Violin
  p3 <- numeric_data %>%
    gather() %>%
    ggplot(aes(x = key, y = value)) +
    geom_violin(fill = "lightblue") +
    geom_boxplot(width = 0.1) +
    theme_minimal() +
    theme(axis.text.x = element_text(angle = 45)) +
    labs(title = "Distribution Comparison")
  ggsave("violin_plots.png", p3)
  
  # Interactive Scatter Plot Matrix
  if (ncol(numeric_data) > 1) {
    scatter_matrix <- plot_ly(data = numeric_data, type = "splom")
    htmlwidgets::saveWidget(scatter_matrix, "scatter_matrix.html")
  }
}

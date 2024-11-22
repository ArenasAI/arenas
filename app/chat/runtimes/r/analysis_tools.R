library(tidyverse)
library(stats)
library(cluster)
library(factoextra)

# Comprehensive data description
describe_data <- function(df) {
  list(
    basic_stats = summary(df),
    missing_values = colSums(is.na(df)),
    data_types = sapply(df, class),
    correlations = if(any(sapply(df, is.numeric))) cor(select_if(df, is.numeric)) else NULL
  )
}

# Data preprocessing
preprocess_data <- function(df, operations) {
  processed_df <- df
  
  for (op in operations) {
    if (op == "normalize") {
      numeric_cols <- sapply(processed_df, is.numeric)
      processed_df[numeric_cols] <- scale(processed_df[numeric_cols])
    } else if (op == "handle_missing") {
      processed_df <- processed_df %>%
        mutate(across(where(is.numeric), ~ifelse(is.na(.), mean(., na.rm = TRUE), .)))
    }
  }
  
  processed_df
}

# Pattern analysis
analyze_patterns <- function(df) {
  numeric_df <- select_if(df, is.numeric)
  
  # PCA
  pca_result <- if(ncol(numeric_df) > 1) {
    prcomp(numeric_df, scale. = TRUE)
  } else NULL
  
  # Clustering
  cluster_result <- if(nrow(numeric_df) > 1) {
    kmeans(numeric_df, centers = min(3, nrow(numeric_df)))
  } else NULL
  
  list(
    pca = if(!is.null(pca_result)) summary(pca_result) else NULL,
    clusters = if(!is.null(cluster_result)) cluster_result$cluster else NULL
  )
}

# Statistical analysis
statistical_analysis <- function(df, target_col = NULL) {
  results <- list()
  
  if (!is.null(target_col) && target_col %in% names(df)) {
    formula <- as.formula(paste(target_col, "~ ."))
    model <- lm(formula, data = df)
    
    results$regression <- list(
      coefficients = coef(model),
      r_squared = summary(model)$r.squared,
      p_values = summary(model)$coefficients[,4]
    )
  }
  
  results
}

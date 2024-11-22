library(jsonlite)
library(tidyverse)
library(reticulate)

# Function to safely execute R code
execute_r_code <- function(code, data = NULL) {
  tryCatch({
    # Create new environment for execution
    env <- new.env()
    
    # If data is provided, convert to data frame and inject into environment
    if (!is.null(data)) {
      env$df <- as.data.frame(data)
    }
    
    # Capture output
    output <- capture.output({
      result <- eval(parse(text = code), envir = env)
    })
    
    # Get variables from environment
    variables <- as.list(env)
    
    # Convert variables to JSON-compatible format
    serializable_vars <- lapply(variables, function(x) {
      if (is.data.frame(x)) {
        return(as.data.frame(x))
      } else if (is.matrix(x)) {
        return(as.matrix(x))
      } else {
        return(x)
      }
    })
    
    # Return results
    list(
      status = "success",
      output = paste(output, collapse = "\n"),
      error = NULL,
      variables = serializable_vars
    )
    
  }, error = function(e) {
    list(
      status = "error",
      output = NULL,
      error = list(
        type = class(e)[1],
        message = conditionMessage(e)
      ),
      variables = list()
    )
  })
}

# Function to handle external calls
handle_execution <- function(input_json) {
  input <- fromJSON(input_json)
  result <- execute_r_code(input$code, input$data)
  toJSON(result, auto_unbox = TRUE)
}

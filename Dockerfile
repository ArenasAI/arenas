# Use Node.js as base image
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    r-base \
    julia \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install \
    matplotlib \
    numpy \
    pandas \
    seaborn \
    plotly

# Install R dependencies
RUN R -e "install.packages(c('ggplot2', 'tidyverse', 'plotly'), repos='http://cran.rstudio.com/')"

# Install Julia dependencies
RUN julia -e 'using Pkg; Pkg.add(["Plots", "DataFrames"])'

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV E2B_API_KEY=""

# Start the application
CMD ["npm", "start"] 
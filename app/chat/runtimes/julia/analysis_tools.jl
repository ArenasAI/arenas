using DataFrames
using Statistics
using Plots

"""
Common analysis tools for Julia runtime
"""

function analyze_dataset(data::DataFrame)
    summary_stats = Dict(
        "rows" => nrow(data),
        "columns" => ncol(data),
        "column_types" => Dict(name => string(type) for (name, type) in zip(names(data), eltype.(eachcol(data)))),
        "missing_values" => Dict(name => sum(ismissing.(col)) for (name, col) in pairs(data))
    )
    
    return summary_stats
end

function perform_statistical_analysis(data::Vector{<:Number})
    return Dict(
        "mean" => mean(data),
        "median" => median(data),
        "std" => std(data),
        "min" => minimum(data),
        "max" => maximum(data)
    )
end

function create_correlation_matrix(data::DataFrame)
    numeric_cols = names(data)[eltype.(eachcol(data)) .<: Number]
    cor_matrix = cor(Matrix(data[:, numeric_cols]))
    return Dict(
        "correlation_matrix" => cor_matrix,
        "variables" => numeric_cols
    )
end

using Plots
using DataFrames
using JSON

"""
Visualization engine for Julia runtime
"""

function create_plot(data::DataFrame, plot_type::String, options::Dict)
    try
        plot_func = get_plot_function(plot_type)
        p = plot_func(data, options)
        
        # Save plot to temporary file
        temp_file = tempname() * ".png"
        savefig(p, temp_file)
        
        return Dict(
            "status" => "success",
            "plot_path" => temp_file
        )
    catch e
        return Dict(
            "status" => "error",
            "error" => string(e)
        )
    end
end

function get_plot_function(plot_type::String)
    plot_types = Dict(
        "scatter" => scatter_plot,
        "line" => line_plot,
        "bar" => bar_plot,
        "histogram" => histogram_plot,
        "box" => box_plot
    )
    
    return get(plot_types, plot_type) do
        error("Unsupported plot type: $plot_type")
    end
end

function scatter_plot(data::DataFrame, options::Dict)
    x = data[:, options["x"]]
    y = data[:, options["y"]]
    scatter(x, y, 
        xlabel=options["x"],
        ylabel=options["y"],
        title=get(options, "title", "Scatter Plot")
    )
end

function line_plot(data::DataFrame, options::Dict)
    x = data[:, options["x"]]
    y = data[:, options["y"]]
    plot(x, y,
        xlabel=options["x"],
        ylabel=options["y"],
        title=get(options, "title", "Line Plot")
    )
end

function bar_plot(data::DataFrame, options::Dict)
    x = data[:, options["x"]]
    y = data[:, options["y"]]
    bar(x, y,
        xlabel=options["x"],
        ylabel=options["y"],
        title=get(options, "title", "Bar Plot")
    )
end

function histogram_plot(data::DataFrame, options::Dict)
    x = data[:, options["x"]]
    histogram(x,
        xlabel=options["x"],
        title=get(options, "title", "Histogram")
    )
end

function box_plot(data::DataFrame, options::Dict)
    x = data[:, options["x"]]
    boxplot(x,
        xlabel=options["x"],
        title=get(options, "title", "Box Plot")
    )
end

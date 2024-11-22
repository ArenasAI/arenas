using JSON

function execute_analysis(code::String, data_source::Union{String,Nothing}=nothing)
    try
        # Create a temporary module to avoid namespace pollution
        mod = Module(:TempModule)
        
        # If data source is provided, load it
        if data_source !== nothing
            # Add data loading logic here
            @eval mod data = read_data($data_source)
        end
        
        # Execute the code in the temporary module
        result = @eval mod begin
            $code
        end
        
        return Dict(
            "status" => "success",
            "result" => string(result)
        )
    catch e
        return Dict(
            "status" => "error",
            "error" => string(e)
        )
    end
end

function handle_request(request::Dict)
    code = get(request, "code", "")
    data_source = get(request, "dataSource", nothing)
    
    result = execute_analysis(code, data_source)
    JSON.json(result)
end

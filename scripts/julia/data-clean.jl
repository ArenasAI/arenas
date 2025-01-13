using CSV

function clean_data(file_path)
    try
        # Read the CSV file
        df = CSV.read(file_path, DataFrame)
        
        # Basic cleaning operations
        # 1. Remove missing values
        df_clean = dropmissing(df)
        
        # 2. Remove duplicates
        df_clean = unique(df_clean)
        
        # 3. Convert strings to lowercase where applicable
        for col in names(df_clean)
            if eltype(df_clean[!, col]) <: AbstractString
                df_clean[!, col] = lowercase.(df_clean[!, col])
            end
        end
        
        println("Cleaning completed successfully!")
        return df_clean
        
    catch e
        println("Error processing file: ", e)
        return nothing
    end
end

file_path = readline()

# Process the file
cleaned_data = clean_data(file_path)

if !isnothing(cleaned_data)
    println("\nFirst few rows of cleaned data:")
    println(first(cleaned_data, 5))
end

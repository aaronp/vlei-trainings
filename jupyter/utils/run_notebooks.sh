  #!/usr/bin/env bash
cd /app/notebooks

# Array of notebook filenames to exclude from conversion
EXCLUDE_NOTEBOOKS=(
    "000_Table_of_Contents.ipynb"
    "101_48_Multisignature_Identifiers.ipynb"
    "101_85_ACDC_Chained_Credentials_NI2I.ipynb"
    "103_10_vLEI_Trust_Chain.ipynb"
)


# Find all notebook files
for notebook in *.ipynb; do
    # Check if the notebook is in the exclusion list
    if [[ " ${EXCLUDE_NOTEBOOKS[@]} " =~ " ${notebook} " ]]; then
        echo "Skipping excluded notebook: $notebook"
        continue
    fi

    echo "Converting $notebook to Markdown in $OUTPUT_DIR"
    jupyter nbconvert --to notebook --execute --inplace --ExecutePreprocessor.timeout=-1 "$notebook"
done

echo "Run complete."

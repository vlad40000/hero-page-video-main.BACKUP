function splitCSVLine(line: string): string[] {
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            currentValue = '';
        } else {
            currentValue += char;
        }
    }
    values.push(currentValue.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    // If we only got one value and it still looks like a CSV line (has commas), 
    // it might be because the whole line was quoted. Let's try to unwrap it once.
    if (values.length === 1 && values[0].includes(',')) {
        return splitCSVLine(values[0]);
    }

    return values;
}

export function parseCSV(csvText: string) {
    const lines = csvText.split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = splitCSVLine(lines[0]);
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim();
        if (!currentLine) continue;

        const values = splitCSVLine(currentLine);

        if (values.length === headers.length) {
            const obj: Record<string, any> = {};

            headers.forEach((header, index) => {
                let value: any = values[index];

                // Type coercion
                if (header === 'price' || header === 'rental_price') {
                    value = value ? parseFloat(value.replace('$', '')) : 0;
                }
                else if (header === 'features' || header === 'images' || header === 'image_url') {
                    // Expecting pipe or semicolon separated values in these cells
                    value = value ? value.split('|').map((s: string) => s.trim()) : [];
                }

                obj[header] = value;
            });

            result.push(obj);
        }
    }

    return result;
}

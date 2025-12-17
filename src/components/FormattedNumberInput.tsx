
import React, { ChangeEvent } from 'react'

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number
    onChange: (value: number) => void
    allowZero?: boolean
}

const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
    value,
    onChange,
    allowZero = true,
    className,
    ...props
}) => {
    // Format the display value
    const displayValue = value === 0 && !allowZero ? '' : value.toLocaleString('vi-VN')

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        // Remove all non-digit characters
        const rawValue = e.target.value.replace(/\D/g, '')

        // Parse to integer
        const numericValue = rawValue === '' ? 0 : parseInt(rawValue, 10)

        onChange(numericValue)
    }

    return (
        <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            className={className}
            {...props}
        />
    )
}

export default FormattedNumberInput

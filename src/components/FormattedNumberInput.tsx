
import React, { ChangeEvent } from 'react'

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value: number
    onChange: (value: number) => void
    allowZero?: boolean
    suffix?: string
}

const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
    value,
    onChange,
    allowZero = true,
    suffix,
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
        <div className="relative">
            <input
                type="text"
                value={displayValue}
                onChange={handleChange}
                className={`w-full ${className || ''}`}
                {...props}
            />
            {suffix && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                    {suffix}
                </div>
            )}
        </div>
    )
}

export default FormattedNumberInput

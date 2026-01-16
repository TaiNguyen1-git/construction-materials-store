/**
 * Disable console.log in production for security
 * This prevents any sensitive data from being logged to browser console
 */

export function disableConsoleInProduction() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        // Store original console methods for potential emergency debugging
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug,
        }

        // Disable all console methods in production
        console.log = () => { }
        console.warn = () => { }
        console.info = () => { }
        console.debug = () => { }

        // Keep console.error but sanitize any potential keys
        console.error = (...args: any[]) => {
            // Filter out any strings that look like API keys or tokens
            const sanitizedArgs = args.map(arg => {
                if (typeof arg === 'string') {
                    // Mask potential API keys/tokens
                    return arg.replace(/(api[_-]?key|token|secret|password|auth)[=:]["']?[\w-]+["']?/gi, '[REDACTED]')
                }
                return arg
            })
            originalConsole.error(...sanitizedArgs)
        }

        // Add a way to restore console for debugging (only accessible via DevTools)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__restoreConsole = () => {
            console.log = originalConsole.log
            console.warn = originalConsole.warn
            console.error = originalConsole.error
            console.info = originalConsole.info
            console.debug = originalConsole.debug
        }
    }
}

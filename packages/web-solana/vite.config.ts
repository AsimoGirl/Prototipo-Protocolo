import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 5903
    },
    plugins: [
        react(),
        // Correct usage of nodePolyfills
        nodePolyfills({
            protocolImports: true // This ensures protocol imports are polyfilled when necessary
        })
    ],
    resolve: {
        alias: {
            // Ensure process and other Node.js modules are resolved correctly
            process: 'process/browser',
            buffer: 'buffer',
            stream: 'stream-browserify'
        }
    }
});

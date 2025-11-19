/**
 * Yuku AI SDK (Legacy Mode)
 * Connects to Yuku Backend for Mistral, Flux, and VFS tools.
 */

class YukuAI {
        constructor(config) {
                this.apiKey = config.apiKey;
                this.baseUrl = config.baseUrl || "https://giant-noell-pixelart002-1c1d1fda.koyeb.app/ai";
                this.headers = {
                        "Authorization": `Bearer ${this.apiKey}`, // Assuming you implement Bearer logic or pass in header
                        // Note: For the Python code above, 'current_user' usually expects a Session Token. 
                        // If using API Key, you need to adjust the Dependency in FastAPI.
                };
        }
        
        async ask(prompt, toolId = "mistral_default", files = []) {
                const formData = new FormData();
                formData.append("prompt", prompt);
                formData.append("tool_id", toolId);
                
                files.forEach(file => {
                        formData.append("files", file);
                });
                
                try {
                        const response = await fetch(`${this.baseUrl}/ask`, {
                                method: "POST",
                                headers: { "Authorization": this.apiKey }, // Custom header handling
                                body: formData
                        });
                        return await response.json();
                } catch (error) {
                        console.error("Yuku SDK Error:", error);
                        throw error;
                }
        }
        
        async generateImage(prompt) {
                const formData = new FormData();
                formData.append("prompt", prompt);
                
                try {
                        const response = await fetch(`${this.baseUrl}/generate-image`, {
                                method: "POST",
                                headers: { "Authorization": this.apiKey },
                                body: formData
                        });
                        return await response.json(); // Returns { image_url: "data:image/..." }
                } catch (error) {
                        console.error("Yuku Image Gen Error:", error);
                        throw error;
                }
        }
        
        /**
         * Register a new tool dynamically from the client side
         */
        async createTool(name, slug, systemPrompt, type = "text") {
                try {
                        const response = await fetch(`${this.baseUrl}/tools/add`, {
                                method: "POST",
                                headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": this.apiKey
                                },
                                body: JSON.stringify({ name, slug, system_prompt: systemPrompt, tool_type: type })
                        });
                        return await response.json();
                } catch (error) {
                        console.error("Tool Creation Error:", error);
                }
        }
}

// Usage Example:
// const ai = new YukuAI({ apiKey: "your_user_api_key" });
// ai.ask("Analyze this code", "code_editor", [fileObj]).then(console.log);
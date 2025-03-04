class SiliconFlowImageGenerator extends ImageGenerator {
    constructor() {
        super("SiliconFlow", "硅基流动绘图");
        this.config = {
            api_key: "",  // 通过界面配置的API密钥
            endpoint: "https://api.siliconflow.cn/v1/images/generations",
            default_steps: 50,
            default_style: "digital-art",
            retry_count: 3
        };
    }

    async generateImage(prompt, negative_prompt) {
        try {
            const payload = this.buildPayload(prompt, negative_prompt);
            const response = await this.sendRequest(payload);
            return this.handleResponse(response);
        } catch (error) {
            console.error("硅基流动生成失败:", error);
            throw new Error("图像生成失败: " + error.message);
        }
    }

    buildPayload(prompt, negative_prompt) {
        return {
            prompt: prompt,
            negative_prompt: negative_prompt || "低质量, 模糊, 畸形",
            width: 1024,
            height: 1024,
            steps: this.config.default_steps,
            style_preset: this.config.default_style,
            num_images: 1
        };
    }

    async sendRequest(payload) {
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config.api_key}`
        };

        let retry = 0;
        while (retry < this.config.retry_count) {
            try {
                const response = await fetch(this.config.endpoint, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                if (++retry >= this.config.retry_count) throw error;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    handleResponse(response) {
        if (!response.data || response.data.length === 0) {
            throw new Error("API响应格式异常");
        }
        
        const imageData = response.data[0].b64_json;
        if (!imageData) {
            throw new Error("未找到图片数据");
        }
        
        return {
            url: `data:image/png;base64,${imageData}`,
            seed: response.data[0].seed || Date.now(),
            metadata: {
                model: "SiliconFlow-v2",
                steps: this.config.default_steps,
                style: this.config.default_style
            }
        };
    }

    getSettingsHTML() {
        return `
            <div class="siliconflow_settings">
                <h4>硅基流动配置</h4>
                <label>
                    API密钥：
                    <input type="password" name="api_key" value="${this.config.api_key}">
                </label>
                <label>
                    生成步数：
                    <input type="number" name="default_steps" value="${this.config.default_steps}" min="20" max="150">
                </label>
                <label>
                    默认风格：
                    <select name="default_style">
                        <option value="digital-art">数字艺术</option>
                        <option value="photographic">摄影风格</option>
                        <option value="fantasy-art">奇幻艺术</option>
                    </select>
                </label>
            </div>
        `;
    }
}

// 注册生成器
imageGenerators.register(new SiliconFlowImageGenerator());


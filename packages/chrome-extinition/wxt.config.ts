import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig(
    {
        manifest: {
            host_permissions: [
            "http://localhost:3006/*" 
            ],
            permissions : ['alarms', 'storage', 'tabs'],
            web_accessible_resources: [
                {
                    resources: ["images/*.png"], // путь к вашим картинкам
                    matches: ["<all_urls>"]
                }
            ]
        }
    }
);

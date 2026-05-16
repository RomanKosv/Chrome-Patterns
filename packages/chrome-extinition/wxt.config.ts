import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig(
    {
        manifest: {
            host_permissions: [
            "http://localhost:3006/*" 
            ],
            permissions : ['alarms', 'storage', 'tabs', 'sidePanel', 'identity'],
            web_accessible_resources: [
                {
                    resources: ["images/*.png"], // путь к вашим картинкам
                    matches: ["<all_urls>"]
                }
            ],
            side_panel : {
                default_path : 'sidepanel/index.html'
            },
            key : "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0U6aBlsrQC3xbIcazycKLM5b3KWgXFyuw37tMPuqqJpviikzdv9AN5sBHtwb/T0hmGUBAy1/abDf2NT0Bb2fciRH4uVS/53uIvZ75GQhM+rdlC9sQYj0juh3Z9gFgtjyUaH+mOFPKC6bndXemqcOUxVWEKKILXsm9KlapSHO+U1QO37+26/xuscUwthJZNCAYZmr3IZQxexuCrIu3zDuTc/JcVMAQAMP15ZxQj2err/7zCzJx2ffEnl6YOExTFEzzTXDlrfLafZxHgxCDtI7oZB76DtRr+ztk5GM9hiusXsbhpacnyWCHnHWCOlr73Ao0kyHjOXaDU5SuJOfY+uQHQIDAQAB",
            oauth2 : {
                client_id : "767335034186-qpqv01e69d5jguhvbhcic4j2f3c4bho5.apps.googleusercontent.com",
                scopes : [
                    'openid'
                ]
            }
        },
        webExt : {
            disabled : true
        }
    }
);

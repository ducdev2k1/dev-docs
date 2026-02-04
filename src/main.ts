import { createApp } from "vue";
import App from "./App.vue";
import CodeBlock from "./components/CodeBlock.vue";
import router from "./router";
import "./style.css";

const app = createApp(App);
app.component("CodeBlock", CodeBlock);
app.use(router);
app.mount("#app");

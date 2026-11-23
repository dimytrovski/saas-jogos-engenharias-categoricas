"use client";

import type React from "react";

export function registerCerroWebComponents() {
  if (typeof window === "undefined" || !("customElements" in window)) return;

  if (!customElements.get("cerro-overlay-badge")) {
    class CerroOverlayBadgeElement extends HTMLElement {
      static get observedAttributes() {
        return ["discipline", "charge", "mode", "code"];
      }

      connectedCallback() {
        this.render();
      }

      attributeChangedCallback() {
        this.render();
      }

      private render() {
        const discipline = this.getAttribute("discipline") || "Engenharia";
        const charge = this.getAttribute("charge") || "25";
        const mode = this.getAttribute("mode") || "hibrido";
        const code = this.getAttribute("code") || "ENG-101";

        const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
        shadow.innerHTML = `
          <style>
            :host {
              display: inline-block;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
            .wc-card {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 7px 12px;
              border-radius: 12px;
              background: rgba(9, 15, 26, 0.92);
              border: 1px solid rgba(45, 212, 191, 0.38);
              color: #e2e8f0;
              font-size: 11px;
              box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
            }
            .wc-dot {
              width: 8px;
              height: 8px;
              border-radius: 999px;
              background: #2dd4bf;
              box-shadow: 0 0 10px #2dd4bf;
            }
            .wc-code {
              color: #fbbf24;
              font-weight: 700;
            }
            .wc-meta {
              color: #94a3b8;
            }
          </style>
          <div class="wc-card" part="card">
            <span class="wc-dot" aria-hidden="true"></span>
            <span class="wc-code">409</span>
            <span></span>
            <span class="wc-meta">3F:% · </span>
          </div>
        `;
      }
    }

    customElements.define("cerro-overlay-badge", CerroOverlayBadgeElement);
  }

  if (!customElements.get("cerro-vector-pulse")) {
    class CerroVectorPulseElement extends HTMLElement {
      static get observedAttributes() {
        return ["charge"];
      }

      connectedCallback() {
        this.render();
      }

      attributeChangedCallback() {
        this.render();
      }

      private render() {
        const chargeNum = Math.max(0, Math.min(100, Number(this.getAttribute("charge") || 25)));
        const shadow = this.shadowRoot || this.attachShadow({ mode: "open" });
        shadow.innerHTML = `
          <style>
            :host {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              font-size: 11px;
              color: #cbd5e1;
            }
            .bar-wrap {
              width: 92px;
              height: 7px;
              border-radius: 999px;
              background: rgba(30, 41, 59, 0.9);
              overflow: hidden;
              border: 1px solid rgba(148, 163, 184, 0.25);
            }
            .bar-fill {
              height: 100%;
              width: %;
              background: linear-gradient(90deg, #ef4444, #f59e0b, #2dd4bf);
              transition: width 0.25s ease;
            }
          </style>
          <span>3F</span>
          <div class="bar-wrap"><div class="bar-fill"></div></div>
          <span>%</span>
        `;
      }
    }

    customElements.define("cerro-vector-pulse", CerroVectorPulseElement);
  }
}

type CerroCustomElementsMap = {
  "cerro-overlay-badge": React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement> & {
      code?: string;
      discipline?: string;
      charge?: string;
      mode?: string;
    },
    HTMLElement
  >;
  "cerro-vector-pulse": React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLElement> & {
      charge?: string;
    },
    HTMLElement
  >;
};

declare global {
  namespace JSX {
    interface IntrinsicElements extends CerroCustomElementsMap {}
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends CerroCustomElementsMap {}
  }
}

import {
  LitElement,
  html,
  customElement,
  property,
  TemplateResult,
  css,
  CSSResult
} from "lit-element";
import {
  HomeAssistant,
  handleAction,
  hasAction,
  createThing
} from "custom-card-helpers";

import { RadialMenuConfig } from "./types";
import { CARD_VERSION } from "./const";
import { actionHandler } from "./action-handler-directive";

/* eslint no-console: 0 */
console.info(
  `%c  RADIAL-MENU   \n%c  Version ${CARD_VERSION} `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray"
);

@customElement("radial-menu")
class RadialMenu extends LitElement {
  @property() public hass?: HomeAssistant;
  @property() private _config?: RadialMenuConfig;

  public setConfig(config: RadialMenuConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }

    if (!config.items) {
      throw new Error("Invalid configuration: No items defined");
    }

    this._config = {
      icon: "mdi:menu",
      name: "menu",
      tap_action: {
        action: "toggle-menu"
      },
      hold_action: {
        action: "none"
      },
      double_tap_action: {
        action: "none"
      },
      default_dismiss: true,
      ...config
    };
  }

  public getCardSize(): number {
    return 1;
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    this._config.items.forEach(item => {
      if (item.card) {
        item.element = createThing(item.card);
        item.element!.hass = this.hass;
        item.element!.classList.add("custom");
      }
    });

    return html`
      <nav class="circular-menu">
        <div class="circle">
          ${this._config.items.map((item, index) => {
            const left =
              (
                50 -
                35 *
                  Math.cos(
                    -0.5 * Math.PI -
                      2 * (1 / this._config!.items.length) * index * Math.PI
                  )
              ).toFixed(4) + "%";
            const top =
              (
                50 +
                35 *
                  Math.sin(
                    -0.5 * Math.PI -
                      2 * (1 / this._config!.items.length) * index * Math.PI
                  )
              ).toFixed(4) + "%";

            if (item.card) {
              item.element!.style.setProperty("left", left);
              item.element!.style.setProperty("top", top);
            }

            return item.entity_picture
              ? html`
                  <state-badge
                    @action=${this._handleAction}
                    .actionHandler=${actionHandler({
                      hasHold: hasAction(item.hold_action),
                      hasDoubleTap: hasAction(item.double_tap_action),
                    })}
                    .config=${item}
                    .stateObj=${{
                      attributes: {
                        entity_picture: item.entity_picture
                      },
                      entity_id: "sensor.fake"
                    }}
                    style="
                left:${left};
                top:${top};"
                  ></state-badge>
                `
              : item.card
              ? item.element
              : html`
                  <ha-icon
                    @action=${this._handleAction}
                    .actionHandler=${actionHandler({
                      hasHold: hasAction(item.hold_action),
                      hasDoubleTap: hasAction(item.double_tap_action),
                    })}
                    .config=${item}
                    .icon=${item.icon}
                    .title=${item.name}
                    style="
                left:${left};
                top:${top};"
                  ></ha-icon>
                `;
          })}
        </div>
        ${this._config.entity_picture
          ? html`
              <state-badge
                class="menu-button"
                @action=${this._handleAction}
                .actionHandler=${actionHandler({
                  hasHold: hasAction(this._config.hold_action),
                  hasDoubleTap: hasAction(this._config.double_tap_action),
                })}
                .config=${this._config}
                .stateObj=${{
                  attributes: {
                    entity_picture: this._config.entity_picture
                  },
                  entity_id: "sensor.fake"
                }}
              ></state-badge>
            `
          : html`
              <ha-icon
                class="menu-button"
                @action=${this._handleAction}
                .actionHandler=${actionHandler({
                  hasHold: hasAction(this._config.hold_action),
                  hasDoubleTap: hasAction(this._config.double_tap_action),
                })}
                .icon=${this._config.icon}
                .title=${this._config.name}
                .config=${this._config}
              ></ha-icon>
            `}
      </nav>
    `;
  }

  protected firstUpdated(): void {
    if (this._config && this._config.default_open) {
      this._toggleMenu();
    }
  }

  private _toggleMenu(): void {
    this.shadowRoot!.querySelector(".circle")!.classList.toggle("open");
  }

  private _handleAction(ev): void {
    const config = ev.target.config;
    if (
      config &&
      config.tap_action &&
      config.tap_action.action === "toggle-menu"
    ) {
      this._toggleMenu();
    } else {
      handleAction(this, this.hass!, config, ev.detail.action!);
      if (this._config!.default_dismiss) {
        this._toggleMenu();
      }
    }
  }

  static get styles(): CSSResult {
    return css`
      .circular-menu {
        width: 250px;
        height: 250px;
        margin: 0 auto;
        position: relative;
      }

      .circle {
        width: 250px;
        height: 250px;
        opacity: 0;

        -webkit-transform: scale(0);
        -moz-transform: scale(0);
        transform: scale(0);

        -webkit-transition: all 0.4s ease-out;
        -moz-transition: all 0.4s ease-out;
        transition: all 0.4s ease-out;
      }

      .open.circle {
        opacity: 1;
        -webkit-transform: scale(1);
        -moz-transform: scale(1);
        transform: scale(1);
      }

      .circle ha-icon,
      .circle state-badge,
      .custom {
        display: block;
        position: absolute;
      }

      .custom {
        height: 100px;
        width: 100px;
        margin-left: -40px;
        margin-top: -25px;
      }

      .circle ha-icon,
      .circle state-badge {
        text-decoration: none;
        border-radius: 50%;
        text-align: center;
        height: 40px;
        width: 40px;
        line-height: 40px;
        margin-left: -20px;
        margin-top: -20px;
      }

      .circle ha-icon:hover {
        color: var(--accent-color);
      }

      .circle state-badge:hover {
        background-color: var(--secondary-background-color);
      }

      ha-icon,
      state-badge {
        cursor: pointer;
        color: var(--primary-color);
      }

      ha-icon {
        cursor: pointer;
      }

      .menu-button {
        position: absolute;
        text-decoration: none;
        text-align: center;
        border-radius: 50%;
        display: block;
        height: 40px;
        width: 40px;
        line-height: 40px;
      }

      state-badge.menu-button {
        top: calc(50% - 20px);
        left: calc(50% - 20px);
      }

      ha-icon.menu-button {
        top: calc(50% - 30px);
        left: calc(50% - 30px);
        padding: 10px;
      }

      .menu-button:hover {
        background-color: var(--secondary-background-color);
      }
    `;
  }
}

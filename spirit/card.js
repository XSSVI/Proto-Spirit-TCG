class Card extends HTMLElement {
    constructor() {
        super()
        this.innerHTML = `<h3>$(this.innerText)</h3>`
    }
}

customElements.define("ui-card", Card)

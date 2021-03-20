# Visioning Texts: A D3 project that (locally) visualizes statistics about your messages from Signal or Whatsapp

Pretty much what the title says. All javascript is executed locally in the browser, no of your data is sent anywhere, and you get some (in my opinion) pretty cool data visualizations of your conversations.

Check it out [live](https://brycewilley.xyz/visioning_texts) (still with nothing being sent out).

For instructions on how to download your Signal/Whatsapp messages, see the [setup instructions](setup_instructions.html) (or on the [live site](https://brycewilley.xyz/setup_instructions.html)).

## Installation

* Download the repo (`git clone https://github.com/BryceStevenWilley/visioning_texts.git`)
* Open `index.html` in your browser
* That's it!

The project is entirely self contained, only two libraries are included: [d3](https://d3js.org) for all of the visualizations, and
 [grapheme-splitter](https://github.com/orling/grapheme-splitter) for handling emojis in text.

# Obsidian HTML Server

This plugin allows you to serve your Obsidian vault as an HTTP server, while maintaining your theme and ensuring that your image and file links work.

## Usage

Simply enable the plugin, start the server and open a web browser at `http://localhost:8080/A_MARKDOWN_FILE` to view the same document you see when opening it in Obsidian.

## Notes

- This plugin is intended for sharing your vault within a local network.
- The server is view-only, meaning that no one can change the files in your vault.
- All of the themes and customizations that are visible in Obsidian will be available in the browser.
- Interactivity has not been implemented yet.

## Tips

- To access the server on your local machine, you can use `localhost`. However, for other devices on your network, you will need to use your IP address.
- Create a markdown file with links to other files and use it as an index page (default page), which you can set in your settings.
- If there is an error starting the server, it might be because the port is already in use. In this case, simply change the port to another number.
- You can use [ngrok](https://ngrok.com/) to share your vault openly with someone outside of your local network.

## Issues/Requests

If you encounter any issues or would like to request a new feature, please submit them [here](https://github.com/Pr0dt0s/obsidian-html-server/issues/new).

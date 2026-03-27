export default class clipboard {
  static writeHtml(str: string) {
    // Use the modern Clipboard API to write the HTML as a raw Blob.
    // The legacy execCommand("copy") approach serializes computed DOM styles
    // (Tailwind --tw-* vars, box-sizing, scrollbar-*, etc.) onto every element.
    if (typeof navigator?.clipboard?.write === "function") {
      // For single-cell copies, replace <br> with actual newline characters in
      // the HTML so that external apps (e.g. Google Sheets) don't split the
      // content into multiple rows. The span already carries white-space:pre-wrap
      // so \n renders identically to <br>.
      const isSingleCell = str.includes("fortune-copy-action-span");
      const htmlStr = isSingleCell ? str.replace(/<br\s*\/?>/gi, "\n") : str;
      const htmlBlob = new Blob([htmlStr], { type: "text/html" });
      const plainText = str
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]*>/g, "");
      const textBlob = new Blob(
        [plainText.includes("\n") ? `"${plainText}"` : plainText],
        { type: "text/plain" }
      );
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ])
        .catch((e) => console.error(e));
      return;
    }

    // Fallback for browsers without Clipboard API support
    try {
      let ele = document.getElementById("fortune-copy-content");
      if (!ele) {
        ele = document.createElement("div");
        ele.setAttribute("contentEditable", "true");
        ele.id = "fortune-copy-content";
        ele.style.position = "fixed";
        ele.style.height = "0";
        ele.style.width = "0";
        ele.style.left = "-10000px";
        document.querySelector(".fortune-container")?.append(ele);
      }
      const previouslyFocusedElement = document.activeElement as HTMLElement;
      ele.style.display = "block";
      ele.innerHTML = str;
      ele.focus({ preventScroll: true });
      document.execCommand("selectAll");
      document.execCommand("copy");
      setTimeout(() => {
        ele?.blur();
        previouslyFocusedElement?.focus?.();
      }, 10);
    } catch (e) {
      console.error(e);
    }
  }
}

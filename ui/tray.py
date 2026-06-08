"""System tray icon for the assistant. Lives in its own daemon thread."""

from __future__ import annotations

import logging
import threading
from typing import Callable

from config.identity import ASSISTANT_NAME

log = logging.getLogger(__name__)


class SystemTray:
    def __init__(self, on_quit: Callable[[], None]) -> None:
        self._on_quit = on_quit
        self._thread: threading.Thread | None = None
        self._icon = None

    def start(self) -> None:
        if self._thread is not None and self._thread.is_alive():
            return
        self._thread = threading.Thread(
            target=self._run, name=f"{ASSISTANT_NAME.lower()}-tray", daemon=True)
        self._thread.start()

    def _run(self) -> None:
        try:
            from PIL import Image, ImageDraw
            import pystray
            from pystray import Icon, Menu, MenuItem
        except Exception as e:                                     # noqa: BLE001
            log.warning("Tray dependencies missing: %s — tray disabled.", e)
            return

        image = Image.new("RGB", (64, 64), color=(20, 24, 40))
        draw = ImageDraw.Draw(image)
        draw.ellipse((10, 10, 54, 54), fill=(80, 200, 255))

        def _quit(icon: "pystray.Icon", _item: "pystray.MenuItem") -> None:
            try:
                self._on_quit()
            finally:
                icon.stop()

        menu = Menu(MenuItem("Quit", _quit))
        self._icon = Icon(ASSISTANT_NAME.lower(), image, ASSISTANT_NAME, menu)
        try:
            self._icon.run()
        except Exception as e:                                     # noqa: BLE001
            log.exception("Tray crashed: %s", e)

    def stop(self) -> None:
        if self._icon is not None:
            try:
                self._icon.stop()
            except Exception:                                      # noqa: BLE001
                pass

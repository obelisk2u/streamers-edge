from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    input_path = root / "data" / "processed" / "sentiment_bins_5pct.json"
    output_path = root / "data" / "processed" / "sentiment_bins_5pct.png"

    with input_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    bins = data.get("bins", [])
    if not bins:
        raise SystemExit("No bins found in sentiment_bins_5pct.json")

    labels = [item.get("label", "") for item in bins]
    values = [item.get("avg_sentiment", 0.0) for item in bins]

    try:
        import matplotlib.pyplot as plt
    except ImportError as exc:
        raise SystemExit(
            "matplotlib is required for plotting. Install it with `pip install matplotlib`."
        ) from exc

    plt.figure(figsize=(10, 4.5))
    plt.plot(labels, values, marker="o", linewidth=2, color="#1f4f8f")
    plt.title("Average Sentiment Over Stream (5% Bins)")
    plt.xlabel("Stream Progress")
    plt.ylabel("Average Sentiment")
    plt.grid(True, axis="y", linestyle="--", alpha=0.4)
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.savefig(output_path, dpi=160)
    print(f"Saved plot to {output_path}")


if __name__ == "__main__":
    main()

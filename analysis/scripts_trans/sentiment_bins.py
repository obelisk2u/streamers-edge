from __future__ import annotations

import json
from pathlib import Path

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover
    tqdm = None


def sentiment_value(label: str, score: float) -> float:
    if label == "positive":
        return score
    if label == "negative":
        return -score
    return 0.0


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    sentences_path = (
        root / "data" / "processed" / "transcript_sentence_sentiment.json"
    )
    transcripts_path = (
        root / "data" / "processed" / "combined_transcripts_sentences.json"
    )
    output_path = (
        root / "data" / "processed" / "transcript_sentiment_bins_5pct.json"
    )

    with sentences_path.open("r", encoding="utf-8") as handle:
        sentences = json.load(handle)

    with transcripts_path.open("r", encoding="utf-8") as handle:
        transcripts = json.load(handle)

    durations = {}
    for entry in transcripts:
        vod_id = entry.get("vod_id", "")
        duration = entry.get("transcript", {}).get("duration", 0)
        if vod_id and isinstance(duration, (int, float)) and duration > 0:
            durations[vod_id] = float(duration)

    bins_per_stream = 20
    bin_sums = [0.0] * bins_per_stream
    bin_counts = [0] * bins_per_stream

    iterator = sentences
    if tqdm is not None:
        iterator = tqdm(sentences, desc="Binning sentiment")

    for sentence in iterator:
        vod_id = sentence.get("vod_id", "")
        duration = durations.get(vod_id)
        if not duration:
            continue
        start = float(sentence.get("start", 0.0))
        end = float(sentence.get("end", start))
        midpoint = (start + end) / 2.0
        if midpoint < 0 or midpoint > duration:
            continue
        progress = midpoint / duration
        bin_index = min(int(progress * bins_per_stream), bins_per_stream - 1)
        label = sentence.get("label", "")
        score = float(sentence.get("score", 0.0))
        bin_sums[bin_index] += sentiment_value(label, score)
        bin_counts[bin_index] += 1

    bins = []
    for i in range(bins_per_stream):
        start_pct = i * 5
        end_pct = (i + 1) * 5
        avg = bin_sums[i] / bin_counts[i] if bin_counts[i] else 0.0
        bins.append(
            {
                "label": f"{start_pct}-{end_pct}%",
                "avg_sentiment": round(avg, 4),
                "count": bin_counts[i],
            }
        )

    output = {
        "stream_count": len(durations),
        "bins": bins,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output, handle, indent=2)

    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()

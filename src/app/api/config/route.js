import {
  limits,
  features,
  application,
  defaultAdvanced,
  defaultOptions,
  references,
  styles,
  counts,
  ratios,
  models,
  samplingSteps,
} from "../../../lib/generationConfig";
import { imagePromptCards, videoPromptCards } from "../../../lib/promptPresets";
import { respond } from "../../../lib/server/http";

export function GET() {
  return respond(() => ({
    limits,
    features,
    application,
    defaultAdvanced,
    references,
    styles,
    counts,
    ratios,
    models,
    samplingSteps,
    defaultOptions,
    promptCards: { image: imagePromptCards, video: videoPromptCards },
    pollingInterval: 300,
  }));
}

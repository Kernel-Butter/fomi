export default function PromptBubble({ prompt, model }) { return <div className="prompt-bubble"><p>{prompt}</p><span title={model} className="model-chip">Model <span>{model}</span></span></div>; }

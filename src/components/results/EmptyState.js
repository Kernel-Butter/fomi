import Icon from '../Icon';
import { samples } from '../../lib/mockData';
export default function EmptyState({ onSample }) { return <div className="empty-state"><div className="empty-icon"><Icon name="sparkle" size={29}/></div><h1>Your imagination, brought to life.</h1><div className="sample-prompts">{samples.map(prompt => <button key={prompt} onClick={() => { onSample(prompt); }}><span>{prompt}</span><Icon name="arrow" size={16}/></button>)}</div></div>; }

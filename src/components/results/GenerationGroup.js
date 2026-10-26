import { memo } from 'react';
import PromptBubble from './PromptBubble';
import ResultCard from './ResultCard';
import Skeletons from './Skeletons';
function GenerationGroup({ group, first }) { return <section id={`generation-${group.id}`} className="generation-group" aria-label={group.loading ? 'Generation in progress' : 'Generated results'} aria-busy={group.loading}><PromptBubble prompt={group.prompt} model={group.model}/><div className="result-grid">{group.loading ? <Skeletons count={group.count} ratio={group.ratio}/> : group.items.map((item,index) => <ResultCard key={item.id} item={item} index={index} priority={first && index < 4}/>)}</div></section>; }
export default memo(GenerationGroup);

import { useState } from 'react';
import Icon from '../Icon';
export default function Accordion({ title, children }) { const [open,setOpen] = useState(false); const id = `accordion-${title.toLowerCase()}`; return <section className={`accordion ${open ? 'is-open' : ''}`}><button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{title}<Icon name="chevron" size={15}/></button><div className="accordion-body" id={id} inert={!open ? true : undefined}><div><div className="accordion-content">{children}</div></div></div></section>; }

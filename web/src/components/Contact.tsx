import { person, ui } from '../content'
import { useT } from '../lib/prefs'

export default function Contact() {
  const t = useT()
  return (
    <section id="contact" className="contact">
      <p className="mono contact__kicker">{t(ui.nav.contact)}</p>
      <h2 className="serif contact__title">{t(ui.contactTitle)}</h2>
      <p className="contact__line">{t(ui.contactLine)}</p>
      <a className="serif contact__mail" href={`mailto:${person.email}`}>{person.email}</a>
      <ul className="contact__links">
        <li><a className="mono" href={person.links.github} target="_blank" rel="noreferrer">GitHub ↗</a></li>
        <li><a className="mono" href={person.links.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a></li>
      </ul>
      <p className="mono contact__foot">© {new Date().getFullYear()} {person.name}</p>
    </section>
  )
}

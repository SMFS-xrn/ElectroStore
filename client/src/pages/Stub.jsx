import Button from '../components/buttons/Button.jsx'
export default function Stub({ notFound }) {
  return <section><h1>{notFound ? 'Страница не найдена' : 'Раздел в разработке'}</h1><Button to="/">На главную</Button></section>
}

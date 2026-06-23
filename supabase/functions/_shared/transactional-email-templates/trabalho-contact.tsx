import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  company?: string
  subject?: string
  message?: string
}

const Email = ({ name, email, company, subject, message }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Novo contato via Cuidar+ Trabalho</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Novo contato — Cuidar+ Trabalho</Heading>
        <Text style={text}>Você recebeu uma nova mensagem pelo formulário de contato.</Text>

        <Section style={card}>
          <Text style={label}>Nome</Text>
          <Text style={value}>{name || '—'}</Text>

          <Text style={label}>E-mail de contato</Text>
          <Text style={value}>{email || '—'}</Text>

          <Text style={label}>Empresa</Text>
          <Text style={value}>{company || '—'}</Text>

          <Text style={label}>Assunto</Text>
          <Text style={value}>{subject || '—'}</Text>

          <Hr style={hr} />

          <Text style={label}>Mensagem</Text>
          <Text style={messageStyle}>{message || '—'}</Text>
        </Section>

        <Text style={footer}>Cuidar+ — formulário de contato (página /trabalho)</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    d?.subject ? `[Cuidar+ Trabalho] ${d.subject}` : '[Cuidar+ Trabalho] Novo contato',
  to: 'everojas@proton.me',
  displayName: 'Trabalho — contato',
  previewData: {
    name: 'Maria Souza',
    email: 'maria@empresa.com',
    company: 'Empresa Exemplo',
    subject: 'Quero saber mais',
    message: 'Gostaria de agendar uma conversa sobre o programa.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '24px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', margin: '16px 0' }
const label = { fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', color: '#64748b', margin: '12px 0 4px', fontWeight: '600' }
const value = { fontSize: '15px', color: '#0f172a', margin: '0 0 4px' }
const messageStyle = { fontSize: '15px', color: '#0f172a', lineHeight: '1.6', margin: '0', whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#e2e8f0', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '24px 0 0' }

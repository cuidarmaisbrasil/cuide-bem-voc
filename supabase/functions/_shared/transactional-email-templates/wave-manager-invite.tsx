import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Cuidar+ Trabalho'

interface Props {
  companyName?: string
  managerName?: string
  signupLink?: string
}

const Email = ({ companyName, managerName, signupLink }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Convite para gerenciar as ondas de bem-estar da {companyName ?? 'sua empresa'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Você foi indicado(a) como gestor de ondas</Heading>
        <Text style={text}>
          {managerName ? `Olá, ${managerName}. ` : 'Olá. '}
          A {companyName ?? 'sua empresa'} cadastrou você no {SITE_NAME} como <strong>gestor(a) responsável pelas ondas de avaliação de bem-estar</strong>.
        </Text>
        <Text style={text}>
          Como gestor de ondas, você poderá:
        </Text>
        <ul style={list}>
          <li style={li}>Cadastrar, editar e excluir os e-mails dos colaboradores.</li>
          <li style={li}>Organizar os colaboradores por área, setor e departamento.</li>
          <li style={li}>Aprovar o envio da 1ª onda após revisar a lista.</li>
          <li style={li}>Receber notificações das ondas seguintes (envio automático).</li>
        </ul>
        <Text style={text}>
          Por segurança, você <strong>não</strong> terá acesso às respostas individuais dos colaboradores — apenas o painel de gestão de e-mails e o status das ondas.
        </Text>
        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Button href={signupLink} style={button}>Criar minha conta</Button>
        </Section>
        <Text style={small}>
          Se o botão não funcionar, copie e cole este link no navegador:<br />
          {signupLink}
        </Text>
        <Text style={footer}>Equipe {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Convite: gerencie as ondas de bem-estar${d?.companyName ? ` da ${d.companyName}` : ''}`,
  displayName: 'Convite — Gestor de ondas',
  previewData: {
    companyName: 'Sua empresa',
    managerName: 'Maria',
    signupLink: 'https://cuidarmaisbrasil.life/auth?wm=abc123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '600', color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const small = { fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: '0 0 16px' }
const list = { fontSize: '15px', color: '#334155', lineHeight: '1.7', paddingLeft: '20px', margin: '0 0 16px' }
const li = { marginBottom: '4px' }
const button = { backgroundColor: '#2563eb', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '32px 0 0' }

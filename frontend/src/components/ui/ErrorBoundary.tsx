import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AppErrorFallback } from './AppErrorFallback'

interface Props
{
  children: ReactNode
  fallbackTitle?: string
}

interface State
{
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State>
{
  constructor(props: Props)
  {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State
  {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo)
  {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () =>
  {
    this.setState({ hasError: false })
  }

  render()
  {
    if (this.state.hasError)
    {
      return (
        <AppErrorFallback
          title={this.props.fallbackTitle}
          onRetry={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

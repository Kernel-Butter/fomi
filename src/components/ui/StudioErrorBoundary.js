"use client";
import { Component } from "react";
import ErrorFallback from "./ErrorFallback";
export default class StudioErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error, info) {
    console.error("Studio rendering failed", error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <ErrorFallback onRetry={() => this.setState({ failed: false })} />
    ) : (
      this.props.children
    );
  }
}

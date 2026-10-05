import { describe, expect, it, vi } from 'vitest'
import { aiGateway } from './aiGateway.js'
import { apiClient } from '../../../lib/api/client.js'

describe('aiGateway', () => {
  it('has canonical name "ai-gateway" and status "ready"', () => {
    expect(aiGateway.name).toBe('ai-gateway')
    expect(aiGateway.status).toBe('ready')
    expect(typeof aiGateway.requestExplanation).toBe('function')
  })

  it('is frozen and immutable', () => {
    expect(Object.isFrozen(aiGateway)).toBe(true)

    expect(() => {
      aiGateway.status = 'active'
    }).toThrow()

    expect(() => {
      aiGateway.newProp = 'illegal'
    }).toThrow()
  })

  it('exposes no unauthorized or streaming methods', () => {
    const PROHIBITED_METHODS = [
      'execute',
      'generate',
      'chat',
      'stream',
      'complete',
      'send',
      'invoke',
      'streamExplanation',
    ]

    PROHIBITED_METHODS.forEach((method) => {
      expect(aiGateway[method]).toBeUndefined()
    })

    expect(Object.keys(aiGateway).sort()).toEqual([
      'name',
      'requestExplanation',
      'status',
    ])
  })

  it('throws an error if context is null, undefined, or not an object', async () => {
    await expect(aiGateway.requestExplanation(null)).rejects.toThrow(
      'requestExplanation requires a valid context object.'
    )
    await expect(aiGateway.requestExplanation('invalid')).rejects.toThrow(
      'requestExplanation requires a valid context object.'
    )
  })

  it('calls apiClient.post with canonical path /api/v1/ai/explanations and wraps context', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Success',
        data: {
          requestId: 'test-req-123',
          explanation: 'Sample financial explanation.',
          generatedAt: '2026-10-05T12:00:00Z',
        },
      },
    })

    const sampleContext = { version: '1.0.0', scope: 'monthly' }
    const result = await aiGateway.requestExplanation(sampleContext)

    expect(postSpy).toHaveBeenCalledTimes(1)
    expect(postSpy).toHaveBeenCalledWith('/api/v1/ai/explanations', {
      context: sampleContext,
    })
    expect(result).toEqual({
      requestId: 'test-req-123',
      explanation: 'Sample financial explanation.',
      generatedAt: '2026-10-05T12:00:00Z',
    })

    postSpy.mockRestore()
  })

  it('normalizes 503 service unavailable response through normalizeApiError', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockRejectedValueOnce({
      response: {
        status: 503,
        data: {
          success: false,
          message: 'AI execution service is currently unavailable',
          data: null,
        },
      },
    })

    await expect(
      aiGateway.requestExplanation({ version: '1.0.0' })
    ).rejects.toThrow('AI execution service is currently unavailable')

    postSpy.mockRestore()
  })

  it('does not mutate the input context', async () => {
    const sampleContext = Object.freeze({
      version: '1.0.0',
      scope: 'monthly',
    })

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Success',
        data: {
          requestId: 'test-req-123',
          explanation: 'Ok',
          generatedAt: '2026-10-05T12:00:00Z',
        },
      },
    })

    await expect(aiGateway.requestExplanation(sampleContext)).resolves.toBeDefined()
    postSpy.mockRestore()
  })
})

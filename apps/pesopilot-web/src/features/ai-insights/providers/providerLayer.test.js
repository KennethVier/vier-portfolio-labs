import { describe, expect, it, vi } from 'vitest'
import { providerLayer } from './providerLayer.js'
import {
  createProviderRequest,
  validateProviderRequest,
  PROVIDER_REQUEST_VERSION,
} from './providerRequest.js'
import {
  createProviderResponse,
  validateProviderResponse,
  PROVIDER_RESPONSE_VERSION,
} from './providerResponse.js'
import {
  createProviderDiagnostics,
  validateProviderDiagnostics,
  PROVIDER_DIAGNOSTICS_VERSION,
} from './providerDiagnostics.js'
import { ProviderError, PROVIDER_ERROR_CODES } from './providerErrors.js'
import { assertAdapterContract } from './llmAdapter.js'
import { providerRegistry } from './providerRegistry.js'
import { createOllamaAdapter, ollamaAdapter } from './ollama/ollamaAdapter.js'
import {
  mapToOllamaGeneratePayload,
  mapFromOllamaGenerateResponse,
} from './ollama/ollamaMapper.js'
import { validateLoopbackUrl } from './ollama/ollamaTransport.js'

describe('Phase 11B.3 — Provider Layer / Ollama', () => {
  const samplePromptPackage = Object.freeze({
    version: '1.0.0',
    systemPrompt: 'You are an AI financial observer for PesoPilot.',
    userPrompt:
      'DETERMINISTIC_FINANCIAL_CONTEXT_JSON: {"summary":{"netSavings":5000}}',
  })

  // 1. Adapter Contract & Assertion
  describe('LLM Adapter Contract', () => {
    it('ensures ollamaAdapter satisfies assertAdapterContract', () => {
      expect(() => assertAdapterContract(ollamaAdapter)).not.toThrow()
      expect(ollamaAdapter.id).toBe('ollama')
      expect(ollamaAdapter.locality).toBe('local')
      expect(typeof ollamaAdapter.generate).toBe('function')
    })

    it('rejects malformed or non-object adapters', () => {
      expect(() => assertAdapterContract(null)).toThrow(ProviderError)
      expect(() => assertAdapterContract({})).toThrow(ProviderError)
      expect(() =>
        assertAdapterContract({ id: '', locality: 'local', generate: () => {} }),
      ).toThrow(ProviderError)
      expect(() =>
        assertAdapterContract({ id: 'test', locality: 'invalid', generate: () => {} }),
      ).toThrow(ProviderError)
      expect(() =>
        assertAdapterContract({ id: 'test', locality: 'local' }),
      ).toThrow(ProviderError)
    })
  })

  // 2. Provider Registry
  describe('Provider Registry', () => {
    it('has ollama registered and returns its descriptor', () => {
      const adapter = providerRegistry.getProviderAdapter('ollama')
      expect(adapter).toBeDefined()
      expect(adapter.id).toBe('ollama')

      const descriptor = providerRegistry.getProviderDescriptor('ollama')
      expect(descriptor).toEqual({
        id: 'ollama',
        locality: 'local',
        status: 'active',
      })
    })

    it('lists registered provider descriptors', () => {
      const descriptors = providerRegistry.listProviderDescriptors()
      expect(descriptors).toEqual([
        {
          id: 'ollama',
          locality: 'local',
          status: 'active',
        },
      ])
    })

    it('is immutable and frozen', () => {
      expect(Object.isFrozen(providerRegistry)).toBe(true)
      expect(() => {
        providerRegistry.newField = 'illegal'
      }).toThrow()
    })

    it('throws UNKNOWN_PROVIDER for unregistered or cloud providers', () => {
      const prohibited = ['openai', 'gemini', 'claude', 'anthropic', 'unknown']
      prohibited.forEach((pid) => {
        expect(() => providerRegistry.getProviderAdapter(pid)).toThrowError(
          expect.objectContaining({
            code: PROVIDER_ERROR_CODES.UNKNOWN_PROVIDER,
          }),
        )
      })
    })

    it('does not store prompts, responses, or API keys', () => {
      const keys = Object.keys(providerRegistry).sort()
      expect(keys).toEqual([
        'getProviderAdapter',
        'getProviderDescriptor',
        'listProviderDescriptors',
      ])
    })
  })

  // 3. ProviderRequest DTO
  describe('ProviderRequest DTO', () => {
    it('creates a canonical deterministic ProviderRequest from PromptPackage and model', () => {
      const req1 = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'llama3.2',
      })
      const req2 = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'llama3.2',
      })

      expect(req1).toEqual({
        version: PROVIDER_REQUEST_VERSION,
        providerId: 'ollama',
        model: 'llama3.2',
        prompt: {
          system: samplePromptPackage.systemPrompt,
          user: samplePromptPackage.userPrompt,
        },
        generation: {
          stream: false,
        },
      })

      expect(JSON.stringify(req1)).toBe(JSON.stringify(req2))
      expect(Object.isFrozen(req1)).toBe(true)
      expect(Object.isFrozen(req1.prompt)).toBe(true)
      expect(Object.isFrozen(req1.generation)).toBe(true)
    })

    it('rejects missing or empty model', () => {
      expect(() =>
        createProviderRequest({
          promptPackage: samplePromptPackage,
          model: '',
        }),
      ).toThrow(ProviderError)
      expect(() =>
        createProviderRequest({
          promptPackage: samplePromptPackage,
          model: '   ',
        }),
      ).toThrow(ProviderError)
      expect(() =>
        createProviderRequest({
          promptPackage: samplePromptPackage,
        }),
      ).toThrow(ProviderError)
    })

    it('rejects unsupported providerId', () => {
      expect(() =>
        createProviderRequest({
          promptPackage: samplePromptPackage,
          model: 'llama3.2',
          providerId: 'openai',
        }),
      ).toThrow(ProviderError)
    })

    it('rejects invalid or missing PromptPackage', () => {
      expect(() =>
        createProviderRequest({
          promptPackage: null,
          model: 'llama3.2',
        }),
      ).toThrow(ProviderError)

      expect(() =>
        createProviderRequest({
          promptPackage: { systemPrompt: '', userPrompt: 'test' },
          model: 'llama3.2',
        }),
      ).toThrow(ProviderError)

      expect(() =>
        createProviderRequest({
          promptPackage: { systemPrompt: 'test', userPrompt: '' },
          model: 'llama3.2',
        }),
      ).toThrow(ProviderError)
    })

    it('validates ProviderRequest via validateProviderRequest', () => {
      const validReq = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'llama3.2',
      })
      expect(validateProviderRequest(validReq)).toEqual({
        valid: true,
        errors: [],
      })

      expect(validateProviderRequest(null).valid).toBe(false)
      expect(validateProviderRequest({}).valid).toBe(false)
      expect(
        validateProviderRequest({
          ...validReq,
          generation: { stream: true },
        }).valid,
      ).toBe(false)
    })
  })

  // 4. ProviderResponse & ProviderDiagnostics DTOs
  describe('ProviderResponse & ProviderDiagnostics DTOs', () => {
    it('creates and validates ProviderDiagnostics with explicit nanosecond units', () => {
      const diag = createProviderDiagnostics({
        providerId: 'ollama',
        model: 'llama3.2',
        totalDurationNs: 1250000000,
        loadDurationNs: 250000000,
        promptEvalCount: 150,
        evalCount: 80,
      })

      expect(diag).toEqual({
        version: PROVIDER_DIAGNOSTICS_VERSION,
        providerId: 'ollama',
        model: 'llama3.2',
        totalDurationNs: 1250000000,
        loadDurationNs: 250000000,
        promptEvalCount: 150,
        evalCount: 80,
      })

      expect(validateProviderDiagnostics(diag)).toEqual({
        valid: true,
        errors: [],
      })
      expect(Object.isFrozen(diag)).toBe(true)
    })

    it('does not duplicate finishReason or error states in ProviderDiagnostics', () => {
      const diag = createProviderDiagnostics({
        providerId: 'ollama',
        model: 'llama3.2',
      })
      expect(diag.finishReason).toBeUndefined()
      expect(diag.error).toBeUndefined()
      expect(diag.status).toBeUndefined()
    })

    it('creates and validates canonical ProviderResponse with done_reason preserved', () => {
      const diag = createProviderDiagnostics({
        providerId: 'ollama',
        model: 'llama3.2',
      })

      const resp = createProviderResponse({
        providerId: 'ollama',
        model: 'llama3.2',
        content: 'Your food spending is within budget.',
        finishReason: 'stop',
        diagnostics: diag,
      })

      expect(resp).toEqual({
        version: PROVIDER_RESPONSE_VERSION,
        providerId: 'ollama',
        model: 'llama3.2',
        content: 'Your food spending is within budget.',
        finishReason: 'stop',
        diagnostics: diag,
      })

      expect(validateProviderResponse(resp)).toEqual({
        valid: true,
        errors: [],
      })
      expect(Object.isFrozen(resp)).toBe(true)
    })

    it('does not default finishReason to stop if null/undefined', () => {
      const diag = createProviderDiagnostics({
        providerId: 'ollama',
        model: 'llama3.2',
      })

      const resp = createProviderResponse({
        providerId: 'ollama',
        model: 'llama3.2',
        content: 'Observation text',
        finishReason: null,
        diagnostics: diag,
      })
      expect(resp.finishReason).toBeNull()
    })

    it('rejects empty or whitespace-only content in ProviderResponse', () => {
      const diag = createProviderDiagnostics({
        providerId: 'ollama',
        model: 'llama3.2',
      })

      expect(() =>
        createProviderResponse({
          providerId: 'ollama',
          model: 'llama3.2',
          content: '',
          diagnostics: diag,
        }),
      ).toThrow(ProviderError)

      expect(() =>
        createProviderResponse({
          providerId: 'ollama',
          model: 'llama3.2',
          content: '   ',
          diagnostics: diag,
        }),
      ).toThrow(ProviderError)
    })
  })

  // 5. Loopback URL Validation
  describe('Loopback URL Security Policy', () => {
    it('accepts approved local loopback URLs', () => {
      expect(validateLoopbackUrl('http://127.0.0.1:11434')).toBe(
        'http://127.0.0.1:11434',
      )
      expect(validateLoopbackUrl('http://localhost:11434')).toBe(
        'http://localhost:11434',
      )
      expect(validateLoopbackUrl('http://[::1]:11434')).toBe(
        'http://[::1]:11434',
      )
      expect(validateLoopbackUrl('http://127.0.0.1:8080')).toBe(
        'http://127.0.0.1:8080',
      )
    })

    it('rejects non-http protocols (https, ftp, file)', () => {
      expect(() => validateLoopbackUrl('https://127.0.0.1:11434')).toThrowError(
        expect.objectContaining({
          code: PROVIDER_ERROR_CODES.INSECURE_ENDPOINT_REJECTED,
        }),
      )
      expect(() => validateLoopbackUrl('ftp://localhost:11434')).toThrow(
        ProviderError,
      )
    })

    it('rejects remote domains, public IPs, and private LAN hosts', () => {
      const rejectedUrls = [
        'http://ollama.com',
        'http://api.openai.com',
        'http://192.168.1.100:11434',
        'http://10.0.0.5:11434',
        'http://172.16.0.1:11434',
        'http://8.8.8.8:11434',
      ]

      rejectedUrls.forEach((url) => {
        expect(() => validateLoopbackUrl(url)).toThrowError(
          expect.objectContaining({
            code: PROVIDER_ERROR_CODES.INSECURE_ENDPOINT_REJECTED,
          }),
        )
      })
    })

    it('rejects URLs with credentials, queries, fragments, or path components', () => {
      expect(() =>
        validateLoopbackUrl('http://user:pass@127.0.0.1:11434'),
      ).toThrow(ProviderError)
      expect(() =>
        validateLoopbackUrl('http://127.0.0.1:11434?token=secret'),
      ).toThrow(ProviderError)
      expect(() =>
        validateLoopbackUrl('http://127.0.0.1:11434#frag'),
      ).toThrow(ProviderError)
      expect(() =>
        validateLoopbackUrl('http://127.0.0.1:11434/api/generate'),
      ).toThrow(ProviderError)
    })
  })

  // 6. Ollama Mapper
  describe('Ollama Mapper', () => {
    it('maps ProviderRequest to Ollama /api/generate payload with stream: false', () => {
      const req = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'llama3.2',
      })
      const payload = mapToOllamaGeneratePayload(req)

      expect(payload).toEqual({
        model: 'llama3.2',
        system: samplePromptPackage.systemPrompt,
        prompt: samplePromptPackage.userPrompt,
        stream: false,
      })

      // Strict exclusion of unnecessary fields
      expect(payload.context).toBeUndefined()
      expect(payload.raw).toBeUndefined()
      expect(payload.format).toBeUndefined()
      expect(payload.images).toBeUndefined()
      expect(payload.tools).toBeUndefined()
      expect(payload.options).toBeUndefined()
      expect(payload.keep_alive).toBeUndefined()
      expect(payload.thinking).toBeUndefined()
    })

    it('maps successful Ollama response and strips thinking and raw fields', () => {
      const rawOllama = {
        model: 'llama3.2',
        created_at: '2026-10-04T12:00:00Z',
        response: 'Your cashflow is positive for this cycle.',
        thinking: 'Internal model reasoning that should be suppressed',
        done: true,
        done_reason: 'stop',
        total_duration: 1500000000,
        load_duration: 300000000,
        prompt_eval_count: 140,
        eval_count: 75,
        context: [1, 2, 3, 4],
      }

      const response = mapFromOllamaGenerateResponse({
        rawData: rawOllama,
        providerId: 'ollama',
        model: 'llama3.2',
      })

      expect(response.content).toBe('Your cashflow is positive for this cycle.')
      expect(response.finishReason).toBe('stop')
      expect(response.diagnostics.totalDurationNs).toBe(1500000000)
      expect(response.diagnostics.loadDurationNs).toBe(300000000)
      expect(response.diagnostics.promptEvalCount).toBe(140)
      expect(response.diagnostics.evalCount).toBe(75)

      // Excluded properties
      expect(response.thinking).toBeUndefined()
      expect(response.context).toBeUndefined()
      expect(response.created_at).toBeUndefined()
    })

    it('rejects Ollama response if done !== true', () => {
      const incomplete = {
        model: 'llama3.2',
        response: 'Partial...',
        done: false,
      }

      expect(() =>
        mapFromOllamaGenerateResponse({
          rawData: incomplete,
          providerId: 'ollama',
          model: 'llama3.2',
        }),
      ).toThrowError(
        expect.objectContaining({
          code: PROVIDER_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
        }),
      )
    })
  })

  // 7. Critical Locality Preflight & Ollama Adapter
  describe('Ollama Adapter & Locality Preflight', () => {
    it('executes preflight with model ONLY, and proceeds to generation for local models', async () => {
      const mockTransport = vi.fn().mockImplementation((url, options) => {
        if (url.endsWith('/api/show')) {
          // Preflight inspection
          expect(options.body).toEqual({ model: 'llama3.2' })
          expect(options.body.system).toBeUndefined()
          expect(options.body.prompt).toBeUndefined()
          return Promise.resolve({
            status: 200,
            ok: true,
            data: {
              license: 'MIT',
              details: { format: 'gguf', family: 'llama' },
              // remote_host and remote_model are absent -> verified local!
            },
          })
        }

        if (url.endsWith('/api/generate')) {
          expect(options.body.model).toBe('llama3.2')
          expect(options.body.system).toBe(samplePromptPackage.systemPrompt)
          expect(options.body.prompt).toBe(samplePromptPackage.userPrompt)
          expect(options.body.stream).toBe(false)
          return Promise.resolve({
            status: 200,
            ok: true,
            data: {
              model: 'llama3.2',
              response: 'Financial observation from local model.',
              done: true,
              done_reason: 'stop',
              total_duration: 1000000000,
            },
          })
        }

        throw new Error(`Unexpected URL: ${url}`)
      })

      const adapter = createOllamaAdapter({ transport: mockTransport })
      const request = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'llama3.2',
      })

      const response = await adapter.generate(request)

      expect(mockTransport).toHaveBeenCalledTimes(2)
      expect(response.content).toBe('Financial observation from local model.')
      expect(response.model).toBe('llama3.2')
      expect(response.providerId).toBe('ollama')
      expect(response.finishReason).toBe('stop')
    })

    it('rejects remote models when remote_host is populated (preflight rejects, zero prompt sent)', async () => {
      const mockTransport = vi.fn().mockImplementation((url) => {
        if (url.endsWith('/api/show')) {
          return Promise.resolve({
            status: 200,
            ok: true,
            data: {
              remote_host: 'https://ollama.com:443',
              details: { format: 'gguf' },
            },
          })
        }
        return Promise.resolve({ status: 200, ok: true, data: {} })
      })

      const adapter = createOllamaAdapter({ transport: mockTransport })
      const request = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'cloud-proxied-model',
      })

      await expect(adapter.generate(request)).rejects.toThrowError(
        expect.objectContaining({
          code: PROVIDER_ERROR_CODES.REMOTE_MODEL_REJECTED,
        }),
      )

      // Ensure /api/generate was NEVER invoked
      expect(mockTransport).toHaveBeenCalledTimes(1)
      expect(mockTransport.mock.calls[0][0]).toContain('/api/show')
    })

    it('rejects remote models when remote_model is populated', async () => {
      const mockTransport = vi.fn().mockImplementation((url) => {
        if (url.endsWith('/api/show')) {
          return Promise.resolve({
            status: 200,
            ok: true,
            data: {
              remote_model: 'upstream-cloud-model:latest',
            },
          })
        }
        return Promise.resolve({ status: 200, ok: true, data: {} })
      })

      const adapter = createOllamaAdapter({ transport: mockTransport })
      const request = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'my-alias',
      })

      await expect(adapter.generate(request)).rejects.toThrowError(
        expect.objectContaining({
          code: PROVIDER_ERROR_CODES.REMOTE_MODEL_REJECTED,
        }),
      )

      expect(mockTransport).toHaveBeenCalledTimes(1)
    })

    it('rejects when locality cannot be interpreted safely (unknown locality)', async () => {
      const mockTransport = vi.fn().mockImplementation((url) => {
        if (url.endsWith('/api/show')) {
          return Promise.resolve({
            status: 200,
            ok: true,
            data: null, // invalid response body
          })
        }
        return Promise.resolve({ status: 200, ok: true, data: {} })
      })

      const adapter = createOllamaAdapter({ transport: mockTransport })
      const request = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'test-model',
      })

      await expect(adapter.generate(request)).rejects.toThrowError(
        expect.objectContaining({
          code: PROVIDER_ERROR_CODES.UNKNOWN_LOCALITY_REJECTED,
        }),
      )
    })

    it('maps 404 with model not found error to MODEL_NOT_FOUND', async () => {
      const mockTransport = vi.fn().mockImplementation((url) => {
        if (url.endsWith('/api/show')) {
          return Promise.resolve({
            status: 404,
            ok: false,
            data: {
              error: "model 'missing-model' not found, try pulling it first",
            },
          })
        }
        return Promise.resolve({ status: 200, ok: true, data: {} })
      })

      const adapter = createOllamaAdapter({ transport: mockTransport })
      const request = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'missing-model',
      })

      await expect(adapter.generate(request)).rejects.toThrowError(
        expect.objectContaining({
          code: PROVIDER_ERROR_CODES.MODEL_NOT_FOUND,
          status: 404,
        }),
      )
    })

    it('maps generic non-2xx status to PROVIDER_REJECTED_REQUEST when not model-not-found', async () => {
      const mockTransport = vi.fn().mockImplementation((url) => {
        if (url.endsWith('/api/show')) {
          return Promise.resolve({
            status: 500,
            ok: false,
            data: { error: 'Internal server failure' },
          })
        }
        return Promise.resolve({ status: 200, ok: true, data: {} })
      })

      const adapter = createOllamaAdapter({ transport: mockTransport })
      const request = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'llama3.2',
      })

      await expect(adapter.generate(request)).rejects.toThrowError(
        expect.objectContaining({
          code: PROVIDER_ERROR_CODES.PROVIDER_REJECTED_REQUEST,
          status: 500,
        }),
      )
    })

    it('ensures no retry occurs upon generation failure', async () => {
      let generateCalls = 0
      const mockTransport = vi.fn().mockImplementation((url) => {
        if (url.endsWith('/api/show')) {
          return Promise.resolve({
            status: 200,
            ok: true,
            data: {},
          })
        }
        if (url.endsWith('/api/generate')) {
          generateCalls++
          return Promise.resolve({
            status: 503,
            ok: false,
            data: { error: 'Busy' },
          })
        }
        return Promise.resolve({ status: 200, ok: true, data: {} })
      })

      const adapter = createOllamaAdapter({ transport: mockTransport })
      const request = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'llama3.2',
      })

      await expect(adapter.generate(request)).rejects.toThrow(ProviderError)
      expect(generateCalls).toBe(1) // exactly one call, no retry
    })

    it('does not leak PromptPackage or prompt text in ProviderError', async () => {
      const mockTransport = vi.fn().mockRejectedValue(new Error('Network drop'))
      const adapter = createOllamaAdapter({ transport: mockTransport })
      const request = createProviderRequest({
        promptPackage: samplePromptPackage,
        model: 'llama3.2',
      })

      try {
        await adapter.generate(request)
        expect.unreachable()
      } catch (err) {
        expect(err).toBeInstanceOf(ProviderError)
        expect(err.message).not.toContain(samplePromptPackage.userPrompt)
        expect(err.message).not.toContain(samplePromptPackage.systemPrompt)
        expect(err.requestBody).toBeUndefined()
        expect(err.promptPackage).toBeUndefined()
      }
    })
  })

  // 8. providerLayer Facade
  describe('providerLayer Facade Integration', () => {
    it('exposes the approved ready facade without operational execution methods', () => {
      expect(providerLayer.name).toBe('provider-layer')
      expect(providerLayer.status).toBe('ready')
      expect(typeof providerLayer.getProvider).toBe('function')
      expect(typeof providerLayer.getProviderDescriptor).toBe('function')
      expect(typeof providerLayer.listProviders).toBe('function')
      expect(typeof providerLayer.createProviderRequest).toBe('function')
      expect(typeof providerLayer.validateProviderRequest).toBe('function')
      expect(typeof providerLayer.validateProviderResponse).toBe('function')
      expect(typeof providerLayer.validateProviderDiagnostics).toBe('function')

      // Prohibited methods
      expect(providerLayer.generate).toBeUndefined()
      expect(providerLayer.execute).toBeUndefined()
      expect(providerLayer.chat).toBeUndefined()
      expect(providerLayer.stream).toBeUndefined()
      expect(providerLayer.retry).toBeUndefined()
      expect(providerLayer.fallback).toBeUndefined()
    })

    it('retrieves the registered ollama adapter through the facade', () => {
      const adapter = providerLayer.getProvider('ollama')
      expect(adapter).toBeDefined()
      expect(adapter.id).toBe('ollama')
      expect(adapter.locality).toBe('local')
    })
  })
})

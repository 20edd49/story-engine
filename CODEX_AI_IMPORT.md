# Smart Import completion

## Package and files

- Added the official `openai` npm package, version `7.23.0` (`^7.23.0` in `package.json`); `package-lock.json` updated.
- Added `src/lib/import/ai-schema.ts` (strict schema), `ai-parse.ts` (server-side API call, schema checking, source mapping), and `catalog.ts` (compact live entity catalog).
- Added `src/app/api/admin/import/parse/route.ts` and `tests/ai-import.test.ts`.
- Updated `src/lib/import/types.ts`, `normalize.ts`, and `validate.ts` for chapter metadata, locations, source ranges, dates, unresolved references, and extracted notes.
- Updated `src/app/admin/import/page.tsx`, `workspace.tsx`, and `import.css` for the separate Quick Import and Smart Import paths and audit preview.
- `src/lib/import/parse.ts` remains the deterministic Quick Import parser.

## API and limits

Smart Import uses the OpenAI **Responses API** through `client.responses.create`, model `gpt-6-astra`, with `text.format.type = "json_schema"`, `strict: true`, and `store: false`. The key is read only from server-side `OPENAI_API_KEY`. The browser sends only text and selected IDs to the route; it never receives the key. The route builds its own catalog instead of trusting browser-supplied entity data. The route has no database mutation.

The current limit is **16,000 UTF-16 characters** of raw story text and **64 KiB** for the HTTP request body. Oversized inputs return HTTP 413 without calling OpenAI. Text is never silently truncated. Long-chapter chunking remains future work.

## Existing entities and source fidelity

The route rebuilds a compact catalog from live repository reads. The prompt receives IDs, slugs, and labels for characters, locations, tags, and selected-continuity scenes, events, relationships, and canon rules. Other universes are excluded from the model's context; the deterministic normalizer and validator still check cross-universe references against the full catalog.

The model proposes 1-based inclusive source-line ranges. The server reconstructs every `Scene.body` directly from the original text at `bodyRanges`; the model's `body` string is only compared for a warning. Invalid or overlapping ranges are rejected. Explicit metadata marker lines and extracted `metadataNotes` may not overlap scene body ranges. Metadata note text is also reconstructed from source lines. Unmapped source lines remain visible as unresolved text. Unsupported date strings are omitted with warnings. The preview shows source ranges, full prose, extracted notes, uncertainty, and validation errors.

## Exact Structured Output schema

The JSON below is generated directly from `SMART_IMPORT_SCHEMA` in `src/lib/import/ai-schema.ts`. All listed object properties are required; nullable fields use `null`. Every object sets `additionalProperties: false`.

```json
{
  "type": "object",
  "properties": {
    "chapter": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "title": {
              "type": [
                "string",
                "null"
              ]
            },
            "number": {
              "type": [
                "string",
                "null"
              ]
            },
            "sourceRange": {
              "anyOf": [
                {
                  "type": "object",
                  "properties": {
                    "start": {
                      "type": "integer"
                    },
                    "end": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "start",
                    "end"
                  ],
                  "additionalProperties": false
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "title",
            "number",
            "sourceRange"
          ],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    },
    "scenes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "slug": {
            "type": [
              "string",
              "null"
            ]
          },
          "title": {
            "type": [
              "string",
              "null"
            ]
          },
          "generatedTitle": {
            "type": "boolean"
          },
          "sourceRange": {
            "type": "object",
            "properties": {
              "start": {
                "type": "integer"
              },
              "end": {
                "type": "integer"
              }
            },
            "required": [
              "start",
              "end"
            ],
            "additionalProperties": false
          },
          "bodyRanges": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "start": {
                  "type": "integer"
                },
                "end": {
                  "type": "integer"
                }
              },
              "required": [
                "start",
                "end"
              ],
              "additionalProperties": false
            }
          },
          "body": {
            "type": "string"
          },
          "boundaryReason": {
            "type": [
              "string",
              "null"
            ]
          },
          "storyOrder": {
            "type": [
              "integer",
              "null"
            ]
          },
          "date": {
            "type": [
              "string",
              "null"
            ]
          },
          "dateDisplay": {
            "type": [
              "string",
              "null"
            ]
          },
          "datePrecision": {
            "type": [
              "string",
              "null"
            ],
            "enum": [
              "exact",
              "approximate",
              "year",
              "narrative",
              null
            ]
          },
          "locationRef": {
            "type": [
              "string",
              "null"
            ]
          },
          "characterRefs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "povCharacterRefs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "tagRefs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "id",
          "slug",
          "title",
          "generatedTitle",
          "sourceRange",
          "bodyRanges",
          "body",
          "boundaryReason",
          "storyOrder",
          "date",
          "dateDisplay",
          "datePrecision",
          "locationRef",
          "characterRefs",
          "povCharacterRefs",
          "tagRefs"
        ],
        "additionalProperties": false
      }
    },
    "proposedCharacters": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "slug": {
            "type": [
              "string",
              "null"
            ]
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": [
              "string",
              "null"
            ]
          },
          "facts": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "tagRefs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "id",
          "slug",
          "name",
          "description",
          "facts",
          "tagRefs"
        ],
        "additionalProperties": false
      }
    },
    "proposedLocations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "slug": {
            "type": [
              "string",
              "null"
            ]
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "id",
          "slug",
          "name",
          "description"
        ],
        "additionalProperties": false
      }
    },
    "proposedEvents": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "slug": {
            "type": [
              "string",
              "null"
            ]
          },
          "title": {
            "type": "string"
          },
          "description": {
            "type": [
              "string",
              "null"
            ]
          },
          "sourceRange": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "start": {
                    "type": "integer"
                  },
                  "end": {
                    "type": "integer"
                  }
                },
                "required": [
                  "start",
                  "end"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          },
          "date": {
            "type": [
              "string",
              "null"
            ]
          },
          "dateDisplay": {
            "type": [
              "string",
              "null"
            ]
          },
          "datePrecision": {
            "type": [
              "string",
              "null"
            ],
            "enum": [
              "exact",
              "approximate",
              "year",
              "narrative",
              null
            ]
          },
          "locationRef": {
            "type": [
              "string",
              "null"
            ]
          },
          "sceneRefs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "characterRefs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "tagRefs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "id",
          "slug",
          "title",
          "description",
          "sourceRange",
          "date",
          "dateDisplay",
          "datePrecision",
          "locationRef",
          "sceneRefs",
          "characterRefs",
          "tagRefs"
        ],
        "additionalProperties": false
      }
    },
    "proposedRelationships": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "slug": {
            "type": [
              "string",
              "null"
            ]
          },
          "title": {
            "type": "string"
          },
          "relationshipType": {
            "type": [
              "string",
              "null"
            ]
          },
          "summary": {
            "type": [
              "string",
              "null"
            ]
          },
          "facts": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "characterRefs": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "id",
          "slug",
          "title",
          "relationshipType",
          "summary",
          "facts",
          "characterRefs"
        ],
        "additionalProperties": false
      }
    },
    "proposedCanonRules": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "slug": {
            "type": [
              "string",
              "null"
            ]
          },
          "title": {
            "type": "string"
          },
          "category": {
            "type": [
              "string",
              "null"
            ]
          },
          "body": {
            "type": "string"
          },
          "sourceRange": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "start": {
                    "type": "integer"
                  },
                  "end": {
                    "type": "integer"
                  }
                },
                "required": [
                  "start",
                  "end"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          }
        },
        "required": [
          "id",
          "slug",
          "title",
          "category",
          "body",
          "sourceRange"
        ],
        "additionalProperties": false
      }
    },
    "proposedTags": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "slug": {
            "type": [
              "string",
              "null"
            ]
          },
          "name": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "slug",
          "name"
        ],
        "additionalProperties": false
      }
    },
    "metadataNotes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "kind": {
            "type": "string",
            "enum": [
              "timeline",
              "canon",
              "tag",
              "character",
              "location",
              "chapter",
              "other"
            ]
          },
          "text": {
            "type": "string"
          },
          "sourceRange": {
            "type": "object",
            "properties": {
              "start": {
                "type": "integer"
              },
              "end": {
                "type": "integer"
              }
            },
            "required": [
              "start",
              "end"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "kind",
          "text",
          "sourceRange"
        ],
        "additionalProperties": false
      }
    },
    "unresolvedReferences": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "input": {
            "type": "string"
          },
          "reason": {
            "type": "string"
          },
          "sourceRange": {
            "anyOf": [
              {
                "type": "object",
                "properties": {
                  "start": {
                    "type": "integer"
                  },
                  "end": {
                    "type": "integer"
                  }
                },
                "required": [
                  "start",
                  "end"
                ],
                "additionalProperties": false
              },
              {
                "type": "null"
              }
            ]
          }
        },
        "required": [
          "input",
          "reason",
          "sourceRange"
        ],
        "additionalProperties": false
      }
    },
    "warnings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "path": {
            "type": "string"
          }
        },
        "required": [
          "code",
          "message",
          "path"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "chapter",
    "scenes",
    "proposedCharacters",
    "proposedLocations",
    "proposedEvents",
    "proposedRelationships",
    "proposedCanonRules",
    "proposedTags",
    "metadataNotes",
    "unresolvedReferences",
    "warnings"
  ],
  "additionalProperties": false
}
```

## Verification and remaining work

ESLint, `tsc --noEmit`, production build, and the full test suite pass. The tests cover schema mapping, unknown and cross-universe characters, exact prose reconstruction, extracted metadata and separator boundaries, invalid output, input limits, and API failure handling. The built `/admin/import` page returned HTTP 200. With no `OPENAI_API_KEY` configured in this environment, the parse route returned a clear HTTP 503 `missing-api-key` response; a live model response was not available to evaluate.

Before Confirm Import or Supabase writes: configure and evaluate a real API key/model response on representative chapters, add admin authentication and production abuse controls, require human approval of proposals, assign stable IDs and resolve references, add server-side persistence validation and transactional writes, and set appropriate RLS/policies. The current endpoint has no auth by request and should not be exposed as a paid public API.

Official API references: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) and [Responses migration](https://developers.openai.com/api/docs/guides/migrate-to-responses).


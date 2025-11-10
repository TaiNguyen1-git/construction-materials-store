'use client'

import { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, Loader2, CheckCircle, XCircle, TrendingUp, Calendar } from 'lucide-react'

interface ModelInfo {
  productId: string
  productName: string
  isActive: boolean
  metrics?: {
    accuracy: number
    mae: number
    rmse: number
    mape: number
    trained_at: string
    model_type: string
  }
}

export default function MLTrainingPage() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      setLoading(true)
      const response = await fetchWithAuth('/api/ml/train')
      const data = await response.json()
      
      if (data.success) {
        setModels(data.data.models || [])
      }
    } catch (error) {
      console.error('Failed to load models:', error)
      setMessage({ type: 'error', text: 'Failed to load models' })
    } finally {
      setLoading(false)
    }
  }

  const trainModel = async (productId?: string) => {
    try {
      setTraining(true)
      setMessage(null)

      const body = productId 
        ? { productIds: [productId] }
        : { trainAll: true }

      const response = await fetchWithAuth('/api/ml/train', {
        method: 'POST',
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        const { successful, total } = data.data.summary
        setMessage({
          type: 'success',
          text: `✅ Training completed: ${successful}/${total} models trained successfully`
        })
        loadModels()
      } else {
        setMessage({ type: 'error', text: data.error || 'Training failed' })
      }
    } catch (error) {
      console.error('Training error:', error)
      setMessage({ type: 'error', text: 'Training request failed' })
    } finally {
      setTraining(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            ML Model Training
          </h1>
          <p className="text-muted-foreground mt-1">
            Train and manage Prophet ML models for advanced predictions
          </p>
        </div>
        <Button
          onClick={() => trainModel()}
          disabled={training}
          size="lg"
          className="gap-2"
        >
          {training ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Training...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Train All Models
            </>
          )}
        </Button>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Models</CardDescription>
            <CardTitle className="text-3xl">{models.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Accuracy</CardDescription>
            <CardTitle className="text-3xl">
              {models.length > 0
                ? `${(models.reduce((sum, m) => sum + (m.metrics?.accuracy || 0), 0) / models.length).toFixed(1)}%`
                : 'N/A'}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Products</CardDescription>
            <CardTitle className="text-3xl">
              {models.filter(m => m.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 How It Works</CardTitle>
          <CardDescription>
            Prophet ML models provide 85-95% accuracy (vs 70-85% for statistical)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">📊 Statistical Method (Current)</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Simple linear regression</li>
                <li>Hard-coded seasonality</li>
                <li>70-85% accuracy</li>
                <li>No training required</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">🤖 Prophet ML (Advanced)</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Facebook Prophet algorithm</li>
                <li>Auto-learns seasonality patterns</li>
                <li>85-95% accuracy</li>
                <li>Requires training (1-2 min per model)</li>
              </ul>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              💡 <strong>Tip:</strong> Train models for your best-selling products first. 
              The system will automatically use Prophet ML when available, falling back to statistical for others.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Models List */}
      <Card>
        <CardHeader>
          <CardTitle>Trained Models</CardTitle>
          <CardDescription>
            Prophet ML models for inventory prediction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No trained models yet</p>
              <p className="text-sm mt-1">Click "Train All Models" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {models.map((model) => (
                <div
                  key={model.productId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{model.productName}</h3>
                      {model.isActive ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    
                    {model.metrics && (
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Accuracy: {model.metrics.accuracy.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>MAPE: {model.metrics.mape.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Trained: {new Date(model.metrics.trained_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => trainModel(model.productId)}
                    disabled={training}
                  >
                    {training ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Retrain'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Python with Prophet library</p>
              <p className="text-sm text-muted-foreground">
                Install: <code className="bg-muted px-1 rounded">pip install prophet pandas numpy</code>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Minimum 60 days of historical data</p>
              <p className="text-sm text-muted-foreground">
                More data = better accuracy. Ideal: 6+ months
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Training time: 1-2 minutes per product</p>
              <p className="text-sm text-muted-foreground">
                Models are saved and can be reused for predictions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { 
  Trophy, 
  Gift, 
  Star, 
  Calendar, 
  ShoppingBag, 
  Users, 
  Copy,
  Check
} from 'lucide-react'

interface LoyaltyData {
  name: string
  email: string
  currentTier: string
  currentPoints: number
  totalPointsEarned: number
  totalPointsRedeemed: number
  pointsToNextTier: number
  lastPurchaseDate: string | null
  totalPurchases: number
  nextTier: string | null
  tierBenefits: {
    discount: string
    birthdayGift: string
    freeShipping: string
    prioritySupport: string
  }
  referralCode: string
}

const TIER_COLORS = {
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-200',
  SILVER: 'bg-gray-100 text-gray-800 border-gray-200',
  GOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PLATINUM: 'bg-blue-100 text-blue-800 border-blue-200',
  DIAMOND: 'bg-purple-100 text-purple-800 border-purple-200'
}

const TIER_ICONS = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '🏆',
  DIAMOND: '💎'
}

export default function LoyaltyPage() {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const [pointsToRedeem, setPointsToRedeem] = useState(100)
  const [referralCodeCopied, setReferralCodeCopied] = useState(false)

  useEffect(() => {
    fetchLoyaltyData()
  }, [])

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/loyalty')
      
      if (response.ok) {
        const data = await response.json()
        setLoyaltyData(data.data)
      } else {
        toast.error('Failed to load loyalty data')
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error)
      toast.error('Failed to load loyalty data')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemPoints = async () => {
    if (pointsToRedeem <= 0) {
      toast.error('Please enter a valid number of points to redeem')
      return
    }

    if (pointsToRedeem > (loyaltyData?.currentPoints || 0)) {
      toast.error('You don\'t have enough points to redeem')
      return
    }

    try {
      setRedeeming(true)
      const response = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem-points',
          pointsToRedeem
        })
      })

      if (response.ok) {
        toast.success(`Successfully redeemed ${pointsToRedeem} points!`)
        fetchLoyaltyData() // Refresh data
        setPointsToRedeem(100)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to redeem points')
      }
    } catch (error) {
      console.error('Error redeeming points:', error)
      toast.error('Failed to redeem points')
    } finally {
      setRedeeming(false)
    }
  }

  const generateReferralCode = async () => {
    try {
      const response = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-referral'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLoyaltyData(prev => prev ? { ...prev, referralCode: data.data.referralCode } : null)
        toast.success('Referral code generated!')
      } else {
        toast.error('Failed to generate referral code')
      }
    } catch (error) {
      console.error('Error generating referral code:', error)
      toast.error('Failed to generate referral code')
    }
  }

  const copyReferralCode = () => {
    if (loyaltyData?.referralCode) {
      navigator.clipboard.writeText(loyaltyData.referralCode)
      setReferralCodeCopied(true)
      setTimeout(() => setReferralCodeCopied(false), 2000)
      toast.success('Referral code copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!loyaltyData) {
    return (
      <div className="text-center py-12">
        <Trophy className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No loyalty data</h3>
        <p className="mt-1 text-sm text-gray-500">You don&apos;t have any loyalty information yet.</p>
      </div>
    )
  }

  const tierColor = TIER_COLORS[loyaltyData.currentTier as keyof typeof TIER_COLORS] || TIER_COLORS.BRONZE
  const tierIcon = TIER_ICONS[loyaltyData.currentTier as keyof typeof TIER_ICONS] || TIER_ICONS.BRONZE

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
        <p className="mt-1 text-sm text-gray-500">
          Earn points with every purchase and unlock exclusive benefits
        </p>
      </div>

      {/* Current Tier Card */}
      <div className={`bg-white rounded-lg border ${tierColor} p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <span className="text-2xl mr-2">{tierIcon}</span>
              <h2 className="text-xl font-bold">Current Tier: {loyaltyData.currentTier}</h2>
            </div>
            <p className="mt-2 text-sm">
              {loyaltyData.pointsToNextTier > 0 
                ? `${loyaltyData.pointsToNextTier} points to reach ${loyaltyData.nextTier}`
                : 'You\'ve reached the highest tier!'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{loyaltyData.currentPoints}</div>
            <div className="text-sm">Points Available</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ 
                width: `${Math.min(100, ((loyaltyData.totalPointsEarned - (loyaltyData.totalPointsEarned - loyaltyData.currentPoints)) / 
                  (loyaltyData.totalPointsEarned + loyaltyData.pointsToNextTier || 1)) * 100)}%` 
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>{loyaltyData.totalPointsEarned} earned</span>
            <span>{loyaltyData.totalPointsEarned + loyaltyData.pointsToNextTier} next tier</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Benefits Card */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Gift className="h-5 w-5 mr-2 text-blue-500" />
            Tier Benefits
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Discount</span>
              <span className="text-sm font-medium">{loyaltyData.tierBenefits.discount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Birthday Gift</span>
              <span className="text-sm font-medium">{loyaltyData.tierBenefits.birthdayGift}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Free Shipping</span>
              <span className="text-sm font-medium">{loyaltyData.tierBenefits.freeShipping}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Support</span>
              <span className="text-sm font-medium">{loyaltyData.tierBenefits.prioritySupport}</span>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Star className="h-5 w-5 mr-2 text-yellow-500" />
            Statistics
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Points Earned</span>
              <span className="text-sm font-medium">{loyaltyData.totalPointsEarned}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Points Redeemed</span>
              <span className="text-sm font-medium">{loyaltyData.totalPointsRedeemed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Purchases</span>
              <span className="text-sm font-medium">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(loyaltyData.totalPurchases)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Last Purchase</span>
              <span className="text-sm font-medium">
                {loyaltyData.lastPurchaseDate 
                  ? new Date(loyaltyData.lastPurchaseDate).toLocaleDateString() 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Redeem Points Card */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <ShoppingBag className="h-5 w-5 mr-2 text-green-500" />
            Redeem Points
          </h3>
          <div className="mt-4">
            <div className="flex items-center mb-4">
              <input
                type="number"
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(parseInt(e.target.value) || 0)}
                min="100"
                max={loyaltyData.currentPoints}
                step="100"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              />
              <span className="ml-2 text-sm text-gray-500">points</span>
            </div>
            <button
              onClick={handleRedeemPoints}
              disabled={redeeming || pointsToRedeem <= 0 || pointsToRedeem > loyaltyData.currentPoints}
              className={`w-full px-4 py-2 rounded-md text-sm font-medium text-white ${
                redeeming || pointsToRedeem <= 0 || pointsToRedeem > loyaltyData.currentPoints
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {redeeming ? 'Redeeming...' : 'Redeem Points'}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Minimum 100 points. Each 100 points = 10,000 VND discount
            </p>
          </div>
        </div>
      </div>

      {/* Referral Program */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-500" />
          Referral Program
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Share your referral code with friends and earn 100 points for each successful referral
        </p>
        
        <div className="mt-4 flex items-center">
          <div className="flex-1 bg-gray-50 rounded-md px-4 py-2 font-mono text-sm">
            {loyaltyData.referralCode || 'No referral code generated'}
          </div>
          {loyaltyData.referralCode ? (
            <button
              onClick={copyReferralCode}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
            >
              {referralCodeCopied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </button>
          ) : (
            <button
              onClick={generateReferralCode}
              className="ml-2 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
            >
              Generate Code
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
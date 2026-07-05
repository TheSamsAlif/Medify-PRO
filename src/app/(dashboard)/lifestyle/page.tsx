"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Apple,
  Droplets,
  Dumbbell,
  Plus,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Coffee,
  Beef,
  Carrot,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const WATER_GOAL = 2000
const EXERCISE_GOAL = 30
const MEAL_TYPES = [
  { value: "breakfast", label: "সকালের নাস্তা", icon: Coffee, time: "সকাল ৭-৯টা", color: "from-amber-400 to-orange-500" },
  { value: "lunch", label: "দুপুরের খাবার", icon: Beef, time: "দুপুর ১২-২টা", color: "from-emerald-400 to-teal-500" },
  { value: "snack", label: "নাস্তা", icon: Apple, time: "বিকাল ৪-৫টা", color: "from-rose-400 to-pink-500" },
  { value: "dinner", label: "রাতের খাবার", icon: Carrot, time: "রাত ৮-১০টা", color: "from-indigo-400 to-purple-500" },
]

interface DietEntry {
  id: string
  mealType: string
  foods: string[]
  calories: number | null
  notes: string | null
  completed: boolean
}

export default function LifestylePage() {
  const [loading, setLoading] = useState(true)
  const [waterIntake, setWaterIntake] = useState(0)
  const [exerciseLogs, setExerciseLogs] = useState<{ id: string; value: number; notes: string | null }[]>([])
  const [dietEntries, setDietEntries] = useState<DietEntry[]>([])
  const [addingWater, setAddingWater] = useState(false)
  const [addingExercise, setAddingExercise] = useState(false)
  const [exerciseDuration, setExerciseDuration] = useState("30")
  const [exerciseNotes, setExerciseNotes] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/lifestyle")
      if (res.ok) {
        const data = await res.json()
        setDietEntries(data.dietPlans || [])
        setWaterIntake(data.waterIntake || 0)
        setExerciseLogs(data.exerciseLogs || [])
      }
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  const addWater = async (amount: number) => {
    setAddingWater(true)
    try {
      const res = await fetch("/api/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "water", data: { amount } }),
      })
      if (res.ok) {
        setWaterIntake((prev) => prev + amount)
        toast.success(`${amount}ml পানি যোগ করা হয়েছে`)
      }
    } catch {
      toast.error("সমস্যা হয়েছে")
    } finally {
      setAddingWater(false)
    }
  }

  const addExercise = async () => {
    const duration = parseInt(exerciseDuration)
    if (!duration || duration < 1) {
      toast.error("ব্যায়ামের সময় দিন")
      return
    }
    setAddingExercise(true)
    try {
      const res = await fetch("/api/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "exercise", data: { duration, notes: exerciseNotes } }),
      })
      if (res.ok) {
        toast.success(`${duration} মিনিট ব্যায়াম লগ করা হয়েছে`)
        setExerciseDuration("30")
        setExerciseNotes("")
        fetchData()
      }
    } catch {
      toast.error("সমস্যা হয়েছে")
    } finally {
      setAddingExercise(false)
    }
  }

  const totalExercise = exerciseLogs.reduce((sum, e) => sum + e.value, 0)
  const waterProgress = Math.min((waterIntake / WATER_GOAL) * 100, 100)
  const exerciseProgress = Math.min((totalExercise / EXERCISE_GOAL) * 100, 100)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold">স্বাস্থ্যকর জীবনযাপন</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">ডায়েট, পানি ও ব্যায়াম ট্র্যাকিং</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-950">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Droplets className="w-8 h-8 text-blue-500" />
              <Badge variant="secondary">{waterIntake}ml / {WATER_GOAL}ml</Badge>
            </div>
            <p className="text-sm font-medium mb-2">পানি</p>
            <Progress value={waterProgress} className="h-2 mb-3" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => addWater(200)} disabled={addingWater}>
                +200ml
              </Button>
              <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => addWater(500)} disabled={addingWater}>
                +500ml
              </Button>
              <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={() => addWater(1000)} disabled={addingWater}>
                +1L
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-950">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Dumbbell className="w-8 h-8 text-emerald-500" />
              <Badge variant="secondary">{totalExercise}মি / {EXERCISE_GOAL}মি</Badge>
            </div>
            <p className="text-sm font-medium mb-2">ব্যায়াম</p>
            <Progress value={exerciseProgress} className="h-2 mb-3" />
            <div className="flex gap-2">
              <Input
                type="number"
                value={exerciseDuration}
                onChange={(e) => setExerciseDuration(e.target.value)}
                className="h-8 text-xs rounded-full w-16"
                min="1"
                placeholder="মি"
              />
              <Button variant="outline" size="sm" className="rounded-full text-xs h-8" onClick={addExercise} disabled={addingExercise}>
                {addingExercise ? <Loader2 className="w-3 h-3 animate-spin" /> : "যোগ করুন"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-950">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Apple className="w-8 h-8 text-amber-500" />
              <Badge variant="secondary">
                {dietEntries.filter((d) => d.completed).length}/{MEAL_TYPES.length}
              </Badge>
            </div>
            <p className="text-sm font-medium mb-2">আজকের খাবার</p>
            <div className="space-y-1.5">
              {MEAL_TYPES.map((meal) => {
                const isLogged = dietEntries.some((d) => d.mealType === meal.value)
                return (
                  <div key={meal.value} className="flex items-center gap-2 text-xs">
                    {isLogged ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                    <span className={isLogged ? "text-gray-700 dark:text-gray-300" : "text-gray-400"}>{meal.label}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="diet" className="space-y-6">
        <TabsList className="rounded-xl p-1">
          <TabsTrigger value="diet" className="rounded-lg text-sm gap-2">
            <Apple className="w-4 h-4" /> ডায়েট প্ল্যানার
          </TabsTrigger>
          <TabsTrigger value="water" className="rounded-lg text-sm gap-2">
            <Droplets className="w-4 h-4" /> পানি রিমাইন্ডার
          </TabsTrigger>
          <TabsTrigger value="exercise" className="rounded-lg text-sm gap-2">
            <Dumbbell className="w-4 h-4" /> ব্যায়াম
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diet">
          <DietPlanner dietEntries={dietEntries} onAdd={() => fetchData()} />
        </TabsContent>

        <TabsContent value="water">
          <WaterTracker currentIntake={waterIntake} goal={WATER_GOAL} onAdd={addWater} loading={addingWater} />
        </TabsContent>

        <TabsContent value="exercise">
          <ExerciseTracker logs={exerciseLogs} total={totalExercise} goal={EXERCISE_GOAL} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function DietPlanner({ dietEntries, onAdd }: { dietEntries: DietEntry[]; onAdd: () => void }) {
  const [mealType, setMealType] = useState("breakfast")
  const [foods, setFoods] = useState("")
  const [calories, setCalories] = useState("")
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!foods.trim()) {
      toast.error("খাবারের নাম দিন")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "diet",
          data: {
            mealType,
            foods: foods.split(",").map((f) => f.trim()),
            calories: calories ? parseInt(calories) : null,
          },
        }),
      })
      if (res.ok) {
        toast.success("খাবার যোগ করা হয়েছে")
        setFoods("")
        setCalories("")
        onAdd()
      }
    } catch {
      toast.error("সমস্যা হয়েছে")
    } finally {
      setSaving(false)
    }
  }

  const getMealIcon = (type: string) => {
    const meal = MEAL_TYPES.find((m) => m.value === type)
    if (!meal) return Apple
    return meal.icon
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            খাবার যোগ করুন
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {MEAL_TYPES.map((meal) => (
              <button
                key={meal.value}
                onClick={() => setMealType(meal.value)}
                className={`p-3 rounded-xl text-left border-2 transition-all ${
                  mealType === meal.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meal.color} p-1.5 mb-1`}>
                  <meal.icon className="w-full h-full text-white" />
                </div>
                <p className="text-xs font-medium">{meal.label}</p>
                <p className="text-[10px] text-gray-400">{meal.time}</p>
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">খাবার (কমা দিয়ে আলাদা করুন)</label>
            <textarea
              value={foods}
              onChange={(e) => setFoods(e.target.value)}
              placeholder="যেমন: ভাত, ডাল, মাছ, সবজি"
              className="w-full min-h-[60px] px-4 py-3 rounded-xl border border-input bg-transparent text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">ক্যালোরি (ঐচ্ছিক)</label>
            <Input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="যেমন: 450"
              className="py-4 text-sm rounded-xl"
            />
          </div>

          <Button onClick={handleAdd} disabled={saving} className="w-full rounded-xl py-5 gradient-primary text-white">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg shadow-black/5">
        <CardHeader>
          <CardTitle className="text-lg">আজকের খাবারের তালিকা</CardTitle>
        </CardHeader>
        <CardContent>
          {dietEntries.length === 0 ? (
            <div className="text-center py-8">
              <Apple className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">আজকের কোনো খাবার যোগ করা হয়নি</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dietEntries.map((entry) => {
                const meal = MEAL_TYPES.find((m) => m.value === entry.mealType)
                const Icon = meal?.icon || Apple
                return (
                  <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meal?.color || "from-gray-400 to-gray-500"} p-2 flex-shrink-0`}>
                      <Icon className="w-full h-full text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{meal?.label || entry.mealType}</p>
                      <p className="text-xs text-gray-500">{entry.foods.join(", ")}</p>
                      {entry.calories && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                          <Flame className="w-3 h-3" />
                          {entry.calories} kcal
                        </div>
                      )}
                    </div>
                    <Badge variant={entry.completed ? "default" : "secondary"} className="text-xs">
                      {entry.completed ? "খাওয়া হয়েছে" : "বাকি"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function WaterTracker({
  currentIntake,
  goal,
  onAdd,
  loading,
}: {
  currentIntake: number
  goal: number
  onAdd: (amount: number) => void
  loading: boolean
}) {
  const progress = Math.min((currentIntake / goal) * 100, 100)
  const remaining = Math.max(goal - currentIntake, 0)
  const glasses = Math.floor(currentIntake / 250)
  const totalGlasses = Math.ceil(goal / 250)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card className="border-0 shadow-lg shadow-black/5 text-center">
        <CardContent className="p-8">
          <Droplets className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-4xl font-bold text-blue-600">{currentIntake}ml</h3>
          <p className="text-gray-500 mt-1">আজকের পানি গ্রহণ</p>
          <div className="mt-6">
            <Progress value={progress} className="h-3 rounded-full" />
            <p className="text-sm text-gray-500 mt-2">{remaining > 0 ? `${remaining}ml বাকি` : "🎉 লক্ষ্য পূরণ হয়েছে!"}</p>
          </div>
          <div className="flex justify-center gap-1 mt-6">
            {Array.from({ length: totalGlasses }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-8 rounded-b-lg rounded-t-sm transition-colors ${
                  i < glasses ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-800"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">{glasses}/{totalGlasses} গ্লাস</p>
          <div className="flex justify-center gap-3 mt-8">
            <Button variant="outline" className="rounded-full px-6" onClick={() => onAdd(250)} disabled={loading}>
              <Droplets className="w-4 h-4 mr-2" /> ১ গ্লাস
            </Button>
            <Button className="rounded-full px-6 gradient-primary text-white" onClick={() => onAdd(500)} disabled={loading}>
              <Droplets className="w-4 h-4 mr-2" /> ২ গ্লাস
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ExerciseTracker({
  logs,
  total,
  goal,
}: {
  logs: { id: string; value: number; notes: string | null }[]
  total: number
  goal: number
}) {
  const progress = Math.min((total / goal) * 100, 100)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Card className="border-0 shadow-lg shadow-black/5 text-center">
        <CardContent className="p-8">
          <Dumbbell className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-4xl font-bold text-emerald-600">{total} মিনিট</h3>
          <p className="text-gray-500 mt-1">আজকের ব্যায়াম</p>
          <div className="mt-6">
            <Progress value={progress} className="h-3 rounded-full" />
            <p className="text-sm text-gray-500 mt-2">
              {total >= goal ? "🎉 লক্ষ্য পূরণ হয়েছে!" : `${goal - total} মিনিট বাকি`}
            </p>
          </div>

          {logs.length > 0 && (
            <div className="mt-8 text-left space-y-2">
              <p className="text-sm font-medium">ব্যায়ামের লগ</p>
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{log.value} মিনিট</span>
                  </div>
                  {log.notes && <span className="text-xs text-gray-500">{log.notes}</span>}
                </div>
              ))}
            </div>
          )}

          {logs.length === 0 && (
            <div className="mt-8">
              <p className="text-sm text-gray-500">আজকের কোনো ব্যায়াম লগ নেই</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

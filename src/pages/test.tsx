import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DialogButtons } from "@/components/ui/dialog-buttons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Archive,
  Bell,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Edit,
  FileText,
  Github,
  Heart,
  Image,
  Loader2,
  LogOut,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Star,
  Trash,
  User,
  X,
  Rocket,
  AlertTriangle,
  RefreshCw,
  Users,
  FileCheck
} from "lucide-react"
import { useState } from "react"

interface ProfileFormData {
  name: string;
  email: string;
}

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "John Doe",
    email: "john@example.com"
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    toast.success("Profile updated successfully!")
  }

  const handleDelete = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    toast.success("Account deleted successfully!")
  }

  const handleError = () => {
    setHasError(true)
    // Simulate error state
    setTimeout(() => setHasError(false), 2000)
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Theme Test Page</h1>
      
      {/* Ship It Demo */}
      <section className="section-space">
        <h2 className="section-heading">Ship It</h2>
        <div className="ship-it-card">
          <div className="flex-stack">
            <div className="flex-between">
              <h3 className="heading-xl">Track your progress across tools</h3>
              <div className="icon-container">
                <Rocket className="icon-lg" />
              </div>
            </div>
            <p className="section-description">
              Stay focused on your goals, and launch your product faster than ever.
            </p>
            <div className="tip-card">
              <p className="tip-text">
                <span className="tip-label">Pro Tip:</span> 
                Launch faster with guided implementation
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Glow Effects Demo */}
      <section className="section-space">
        <h2 className="section-heading">Glow Effects</h2>
        <div className="grid-cards">
          <Card className="hover-blue">
            <CardHeader>
              <CardTitle>Hover Glow Effect</CardTitle>
              <CardDescription>Hover over this card to see the blue glow effect in both light and dark mode</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="card-content-text">
                The card border and shadow will transition to a glow on hover.
              </p>
            </CardContent>
          </Card>

          <Card className="bordered-card">
            <CardHeader>
              <CardTitle className="text-primary">Permanent Glow</CardTitle>
              <CardDescription>This card always has the glow effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="card-content-text">
                Using the shadow-blue-glow class for constant glow effect in both light and dark mode.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Button Variants */}
      <section className="section-space">
        <h2 className="section-heading">Buttons</h2>
        <div className="flex-wrap-gap">
          <Button variant="default">Default Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="outline">
            <Mail className="icon-button" />
            Outline with Icon
          </Button>
        </div>
      </section>

      {/* Card Example */}
      <section className="section-space">
        <h2 className="section-heading">Card</h2>
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>This is a sample card to test our theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Here's some content inside the card. It should reflect our theme colors properly.</p>
          </CardContent>
          <CardFooter>
            <Button>Card Action</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Alert Dialog */}
      <section className="section-space">
        <h2 className="section-heading">Alert Dialog</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Open Alert Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This is a sample alert dialog to test our theme styling.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      {/* Tabs */}
      <section className="section-space">
        <h2 className="section-heading">Tabs</h2>
        <Tabs defaultValue="account" className="full-width">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account tab content</TabsContent>
          <TabsContent value="password">Password tab content</TabsContent>
          <TabsContent value="settings">Settings tab content</TabsContent>
        </Tabs>
      </section>

      {/* Badges */}
      <section className="section-space">
        <h2 className="section-heading">Badges</h2>
        <div className="flex-wrap-gap">
          <Badge variant="default">Default Badge</Badge>
          <Badge variant="secondary">Secondary Badge</Badge>
          <Badge variant="destructive">Destructive Badge</Badge>
          <Badge variant="outline">Outline Badge</Badge>
        </div>
      </section>

      {/* Form Controls */}
      <section className="section-space">
        <h2 className="section-heading">Interactive Elements</h2>
        <div className="form-container">
          <div className="form-field">
            <Label htmlFor="glow-input">Input with Glow</Label>
            <Input 
              id="glow-input" 
              type="text" 
              placeholder="Type something..."
            />
          </div>
          
          <div className="form-field">
            <Label htmlFor="glow-select">Select with Glow</Label>
            <Select>
              <SelectTrigger id="glow-select">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Option 1</SelectItem>
                <SelectItem value="2">Option 2</SelectItem>
                <SelectItem value="3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="form-field">
            <div className="flex-items-gap">
              <Checkbox id="glow-terms" />
              <Label htmlFor="glow-terms">Accept terms</Label>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notifications */}
      <section className="section-space">
        <h2 className="section-heading">Toast Notifications</h2>
        <div className="flex-wrap-gap">
          <Button
            onClick={() => {
              toast.success("Operation completed successfully", {
                description: "Your changes have been saved.",
              })
            }}
          >
            Show Success Toast
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              toast.error("Operation failed", {
                description: "There was an error saving your changes.",
              })
            }}
          >
            Show Error Toast
          </Button>
        </div>
      </section>

      {/* Sheet (Slide-out Panel) */}
      <section className="section-space">
        <h2 className="section-heading">Sheet Component</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription>
                This is a sheet component that slides in from the side. It's perfect for navigation menus,
                filters, or any secondary content.
              </SheetDescription>
            </SheetHeader>
            <div className="section-padding">
              <p className="text-sm-muted">
                Sheet content goes here. This component will be used for our collapsible side navigation.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </section>

      {/* Typography Plugin Demo */}
      <section className="section-space">
        <h2 className="section-heading">Typography Plugin</h2>
        <div className="prose-container">
          <h1 className="prose-h1">Heading 1</h1>
          <h2 className="prose-h2">Heading 2</h2>
          <h3 className="prose-h3">Heading 3</h3>
          <p className="prose-text">
            This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.
            It demonstrates the typography plugin's default styling.
          </p>
          <blockquote className="prose-blockquote">
            This is a blockquote that shows how quotes are styled using the typography plugin.
          </blockquote>
          <ul className="prose-list">
            <li>Unordered list item 1</li>
            <li>Unordered list item 2</li>
            <li>Unordered list item 3</li>
          </ul>
          <pre><code className="prose-code">// This is a code block
const example = "Typography styling";</code></pre>
        </div>
      </section>

      {/* Accordion */}
      <section className="section-space">
        <h2 className="section-heading">Accordion</h2>
        <Accordion type="single" collapsible className="accordion-default">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <span className="accordion-item-header">
                <Settings className="icon-button" />
                Account Settings
              </span>
            </AccordionTrigger>
            <AccordionContent>
              Manage your account settings and preferences.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              <span className="accordion-item-header">
                <Bell className="icon-button" />
                Notifications
              </span>
            </AccordionTrigger>
            <AccordionContent>
              Configure your notification preferences.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Avatar and HoverCard */}
      <section className="section-space">
        <h2 className="section-heading">User Profiles</h2>
        <div className="flex-gap-8">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Avatar className="avatar-sm">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent className="hover-card-default">
              <div className="flex-between space-x">
                <Avatar className="avatar-md">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="space-y-sm">
                  <h4 className="heading-sm">@shadcn</h4>
                  <p className="text-sm-muted">
                    UI Designer and Developer
                  </p>
                  <div className="flex-center padding-t">
                    <Github className="icon-button" />
                    <span className="text-xs-muted">github.com/shadcn</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">
                  <Mail className="icon-button-with-space" />
                  Send Message
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send a direct message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      {/* Calendar and Date Picker */}
      <section className="section-space">
        <h2 className="section-heading">Calendar</h2>
        <div className="flex-gap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="icon-button-with-space" />
                Pick a date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="popover-calendar">
              <Calendar />
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {/* Dropdown Menu */}
      <section className="section-space">
        <h2 className="section-heading">Dropdown Menu</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <User className="icon-button" />
              Account
              <ChevronDown className="icon-button" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="dropdown-item">
              <Settings className="icon-button" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="dropdown-item">
              <Bell className="icon-button" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="dropdown-item">
              <LogOut className="icon-button" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      {/* Progress and Loading */}
      <section className="section-space">
        <h2 className="section-heading">Progress Indicators</h2>
        <div className="section-space">
          <Progress value={60} className="progress-default" />
          <div className="flex-gap">
            <Button disabled>
              <Loader2 className="icon-button-with-spin" />
              Please wait
            </Button>
            <Button variant="outline" disabled>
              <Loader2 className="icon-button-with-spin" />
              Loading...
            </Button>
          </div>
        </div>
      </section>

      {/* Radio Group and Switch */}
      <section className="section-space">
        <h2 className="section-heading">Selection Controls</h2>
        <div className="form-section">
          <div className="form-group">
            <Label>Notification Method</Label>
            <RadioGroup defaultValue="email">
              <div className="form-row">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email">Email</Label>
              </div>
              <div className="form-row">
                <RadioGroupItem value="sms" id="sms" />
                <Label htmlFor="sms">SMS</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="form-group">
            <Label>Preferences</Label>
            <div className="form-row">
              <Switch id="notifications" />
              <Label htmlFor="notifications">Enable Notifications</Label>
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="section-space">
        <h2 className="section-heading">Data Table</h2>
        <div className="table-container">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>John Doe</TableCell>
                <TableCell><Badge variant="default">Active</Badge></TableCell>
                <TableCell>
                  <div className="flex-gap-2">
                    <Button variant="ghost" className="icon-button-ghost">
                      <Edit className="table-action-icon" />
                    </Button>
                    <Button variant="ghost" size="icon" className="table-action-button">
                      <Trash className="table-action-icon" />
                    </Button>
                    <Button variant="ghost" size="icon" className="table-action-button">
                      <Archive className="table-action-icon" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Jane Smith</TableCell>
                <TableCell><Badge variant="secondary">Inactive</Badge></TableCell>
                <TableCell>
                  <div className="flex-gap-2">
                    <Button variant="ghost" className="icon-button-ghost">
                      <Edit className="table-action-icon" />
                    </Button>
                    <Button variant="ghost" size="icon" className="table-action-button">
                      <Trash className="table-action-icon" />
                    </Button>
                    <Button variant="ghost" size="icon" className="table-action-button">
                      <Archive className="table-action-icon" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Textarea and Toggle */}
      <section className="section-space">
        <h2 className="section-heading">Input Controls</h2>
        <div className="grid-gap">
          <div className="flex-gap">
            <Toggle>
              <Star className="toggle-icon" />
              Favorite
            </Toggle>
            <Toggle>
              <Heart className="toggle-icon" />
              Like
            </Toggle>
          </div>
        </div>
      </section>

      {/* Slider */}
      <section className="section-space">
        <h2 className="section-heading">Range Slider</h2>
        <div className="slider-container">
          <div className="slider-group">
            <Label>Volume</Label>
            <Slider 
              defaultValue={[50]} 
              max={100} 
              step={1}
              className="slider-default"
            />
          </div>
        </div>
      </section>

      {/* Scroll Area */}
      <section className="section-space">
        <h2 className="section-heading">Scroll Area</h2>
        <ScrollArea className="scroll-area-default">
          <div className="scroll-area-content">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="scroll-area-item">
                <FileText className="scroll-area-item-icon" />
                <div>
                  <div className="scroll-area-item-title">Document {i + 1}</div>
                  <div className="text-sm-muted">PDF • 2.3MB</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </section>

      {/* Dialog */}
      <section className="section-space">
        <h2 className="section-heading">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Image className="icon-button" />
              Create New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
              <DialogDescription>
                Share your thoughts with the community.
              </DialogDescription>
            </DialogHeader>
            <div className="section-space section-padding">
              <div className="form-field">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title"
                />
              </div>
              <div className="form-field">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your post content..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">
                <X className="icon-button" />
                Cancel
              </Button>
              <Button>
                <Check className="icon-button" />
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Search with Command */}
      <section className="section-space">
        <h2 className="section-heading">Search</h2>
        <div className="search-container">
          <Search className="search-icon" />
          <Input
            placeholder="Search..."
            className="search-input"
          />
        </div>
      </section>

      {/* AI PRD Generation Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>AI PRD Generation</CardTitle>
          <CardDescription>Example of an AI-powered PRD generation dialog</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Rocket className="h-4 w-4" />
                Generate PRD with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">AI-Powered PRD Generation</DialogTitle>
                <DialogDescription className="mt-4">
                  Let AI help you research and write your PRD. We'll analyze your product details and generate comprehensive content for each section.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Enter your product details</h4>
                      <p className="text-sm text-muted-foreground">Be as detailed as possible about your product's purpose and features</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Select your customer persona</h4>
                      <p className="text-sm text-muted-foreground">Fluxr will analyze your market and suggest who to target</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <FileCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Generate your PRD</h4>
                      <p className="text-sm text-muted-foreground">Our AI will create a comprehensive PRD based on your inputs</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Edit className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Review and customize</h4>
                      <p className="text-sm text-muted-foreground">Approve, edit, and refine the generated content</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-8">
                <Button variant="outline" className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button className="gap-2">
                  <Rocket className="h-4 w-4" />
                  Start AI Generation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* New Dialog Templates */}
      <Card>
        <CardHeader>
          <CardTitle>New Dialog Templates</CardTitle>
          <CardDescription>Examples of the new standardized dialog templates</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Form Dialog Example */}
          <Dialog>
            <DialogTrigger asChild>
              <Button>Edit Profile</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>Make changes to your profile settings.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <DialogButtons
                onCancel={() => {}}
                onConfirm={handleSave}
                confirmText="Save changes"
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>

          {/* Confirmation Dialog Example */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete your account? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogButtons
                onCancel={() => {}}
                onConfirm={handleDelete}
                confirmText="Delete Account"
                confirmIcon={<Trash className="h-4 w-4" />}
                isDestructive
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>

          {/* Loading Dialog Example */}
          <Dialog open={isLoading}>
            <DialogContent>
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <DialogTitle>Processing...</DialogTitle>
                <DialogDescription>Please wait while we process your request.</DialogDescription>
              </div>
            </DialogContent>
          </Dialog>

          {/* Error Dialog Example */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleError}>Show Error</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <DialogTitle>Error</DialogTitle>
                </div>
                <DialogDescription>
                  An error occurred while processing your request. Please try again.
                </DialogDescription>
              </DialogHeader>
              <DialogButtons
                onCancel={() => {}}
                onConfirm={() => {}}
                confirmText="Try Again"
                confirmIcon={<RefreshCw className="h-4 w-4" />}
                isError={hasError}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
} 
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
  X
} from "lucide-react"
import { useState } from "react"

export default function TestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold mb-8 text-foreground">
        Theme Test Page
      </h1>
      
      {/* Neon Effects Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Neon Effects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-neon/50 transition-all duration-200 dark:hover:border-primary/60 dark:bg-gradient-to-br dark:from-[#1A2E2E] dark:to-[#141414]">
            <CardHeader>
              <CardTitle className="hover:text-primary/80 transition-colors duration-200">Hover Glow Effect</CardTitle>
              <CardDescription>Hover over this card to see the neon glow effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The card border and shadow will transition to a neon glow on hover.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-neon/50 border-primary/60 dark:border-primary/60 transition-all duration-200 dark:bg-gradient-to-br dark:from-[#1A2E2E] dark:to-[#141414]">
            <CardHeader>
              <CardTitle className="text-primary/80 transition-colors duration-200">Permanent Glow</CardTitle>
              <CardDescription>This card always has the neon effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Using the shadow-neon class for constant glow effect.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Button Variants */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default" className="hover:shadow-neon/40 transition-all duration-200">Default Button</Button>
          <Button variant="destructive" className="hover:shadow-neon/40 transition-all duration-200">Destructive Button</Button>
          <Button variant="outline" className="hover:bg-primary/20 hover:text-primary transition-all duration-200">Outline Button</Button>
          <Button variant="secondary" className="hover:bg-primary/20 hover:text-primary transition-all duration-200">Secondary Button</Button>
          <Button variant="ghost" className="hover:text-primary/80 hover:bg-primary/10 transition-all duration-200">Ghost Button</Button>
          <Button variant="outline" className="gap-2 hover:bg-primary/20 hover:text-primary transition-all duration-200">
            <Mail className="h-4 w-4" />
            Outline with Icon
          </Button>
        </div>
      </section>

      {/* Card Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Card</h2>
        <Card className="dark:bg-gradient-to-br dark:from-[#1A2E2E] dark:to-[#141414]">
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
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Alert Dialog</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">Open Alert Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="dark:bg-gradient-to-br dark:from-[#1A2E2E] dark:to-[#141414]">
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
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Tabs</h2>
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="dark:bg-[#151515] dark:border dark:border-primary/20">
            <TabsTrigger 
              value="account" 
              className="data-[state=active]:shadow-neon/50 dark:text-primary/60 dark:data-[state=active]:bg-primary/90 dark:data-[state=active]:text-[#151515] dark:hover:text-primary/80 dark:hover:shadow-neon/40 transition-all duration-200"
            >
              Account
            </TabsTrigger>
            <TabsTrigger 
              value="password"
              className="data-[state=active]:shadow-neon/50 dark:text-primary/60 dark:data-[state=active]:bg-primary/90 dark:data-[state=active]:text-[#151515] dark:hover:text-primary/80 dark:hover:shadow-neon/40 transition-all duration-200"
            >
              Password
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:shadow-neon/50 dark:text-primary/60 dark:data-[state=active]:bg-primary/90 dark:data-[state=active]:text-[#151515] dark:hover:text-primary/80 dark:hover:shadow-neon/40 transition-all duration-200"
            >
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="dark:text-primary/80 transition-all duration-200">Account tab content</TabsContent>
          <TabsContent value="password" className="dark:text-primary/80 transition-all duration-200">Password tab content</TabsContent>
          <TabsContent value="settings" className="dark:text-primary/80 transition-all duration-200">Settings tab content</TabsContent>
        </Tabs>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default" className="dark:bg-primary/90 dark:text-[#151515] dark:hover:shadow-neon/40 transition-all duration-200">Default Badge</Badge>
          <Badge variant="secondary" className="dark:bg-primary/20 dark:text-primary/80 dark:hover:bg-primary/90 dark:hover:text-[#151515] dark:hover:shadow-neon/40 transition-all duration-200">Secondary Badge</Badge>
          <Badge variant="destructive" className="dark:hover:shadow-neon/40 transition-all duration-200">Destructive Badge</Badge>
          <Badge variant="outline" className="dark:text-primary/80 dark:border-primary/40 dark:hover:bg-primary/90 dark:hover:text-[#151515] dark:hover:shadow-neon/40 transition-all duration-200">Outline Badge</Badge>
        </div>
      </section>

      {/* Form Controls */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Interactive Elements</h2>
        <div className="grid gap-6 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="neon-input">Neon Input</Label>
            <Input 
              id="neon-input" 
              type="text" 
              placeholder="Type something..."
              className="dark:bg-[#151515] dark:border-primary/20 focus:dark:border-primary/40 focus:outline-none focus:ring-0 focus:ring-offset-0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="neon-select">Neon Select</Label>
            <Select>
              <SelectTrigger 
                id="neon-select" 
                className="dark:bg-[#151515] dark:border-primary/20 focus:dark:border-primary/40 dark:text-white focus:outline-none focus:ring-0 focus:ring-offset-0"
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent className="dark:bg-[#151515] dark:border-primary/20">
                <SelectItem value="1" className="dark:text-white hover:dark:text-white hover:bg-primary/10 focus:bg-primary/10 focus:outline-none focus:ring-0 focus:ring-offset-0">Option 1</SelectItem>
                <SelectItem value="2" className="dark:text-white hover:dark:text-white hover:bg-primary/10 focus:bg-primary/10 focus:outline-none focus:ring-0 focus:ring-offset-0">Option 2</SelectItem>
                <SelectItem value="3" className="dark:text-white hover:dark:text-white hover:bg-primary/10 focus:bg-primary/10 focus:outline-none focus:ring-0 focus:ring-offset-0">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="neon-terms" 
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:shadow-neon dark:border-primary/20 dark:hover:border-primary dark:data-[state=checked]:shadow-neon-strong transition-all duration-200" 
            />
            <Label htmlFor="neon-terms" className="hover:text-primary transition-colors duration-200">Accept terms</Label>
          </div>
        </div>
      </section>

      {/* Toast Notifications */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Toast Notifications</h2>
        <div className="flex flex-wrap gap-4">
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
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Sheet Component</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open Sheet</Button>
          </SheetTrigger>
          <SheetContent className="dark:bg-gradient-to-br dark:from-[#1A2E2E] dark:to-[#141414]">
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription>
                This is a sheet component that slides in from the side. It's perfect for navigation menus,
                filters, or any secondary content.
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <p className="text-sm text-muted-foreground">
                Sheet content goes here. This component will be used for our collapsible side navigation.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </section>

      {/* Typography Plugin Demo */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Typography Plugin</h2>
        <div className="prose dark:prose-invert max-w-none [&>pre]:bg-[#1A1A1A] [&>pre]:border [&>pre]:border-primary/20">
          <h1>Heading 1</h1>
          <h2>Heading 2</h2>
          <h3>Heading 3</h3>
          <p>
            This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.
            It demonstrates the typography plugin's default styling.
          </p>
          <blockquote>
            This is a blockquote that shows how quotes are styled using the typography plugin.
          </blockquote>
          <ul>
            <li>Unordered list item 1</li>
            <li>Unordered list item 2</li>
            <li>Unordered list item 3</li>
          </ul>
          <pre><code>// This is a code block
const example = "Typography styling";</code></pre>
        </div>
      </section>

      {/* Accordion */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Accordion</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-primary/20">
            <AccordionTrigger className="hover:text-primary transition-colors">
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Account Settings
              </span>
            </AccordionTrigger>
            <AccordionContent>
              Manage your account settings and preferences.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-primary/20">
            <AccordionTrigger className="hover:text-primary transition-colors">
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
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
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">User Profiles</h2>
        <div className="flex items-center gap-8">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/60 transition-colors cursor-pointer">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="bg-primary/10">CN</AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 dark:bg-gradient-to-br dark:from-[#1A2E2E] dark:to-[#141414]">
              <div className="flex justify-between space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">@shadcn</h4>
                  <p className="text-sm text-muted-foreground">
                    UI Designer and Developer
                  </p>
                  <div className="flex items-center pt-2">
                    <Github className="mr-2 h-4 w-4" />
                    <span className="text-xs text-muted-foreground">github.com/shadcn</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="gap-2 hover:bg-primary/20 hover:text-primary">
                  <Mail className="h-4 w-4" />
                  Send Message
                </Button>
              </TooltipTrigger>
              <TooltipContent className="dark:bg-[#151515] dark:border-primary/20">
                <p>Send a direct message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      {/* Calendar and Date Picker */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Calendar</h2>
        <div className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 hover:bg-primary/20 hover:text-primary">
                <CalendarIcon className="h-4 w-4" />
                Pick a date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 dark:bg-gradient-to-br dark:from-[#1A2E2E] dark:to-[#141414]">
              <Calendar className="dark:bg-transparent" />
            </PopoverContent>
          </Popover>
        </div>
      </section>

      {/* Dropdown Menu */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Dropdown Menu</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 hover:bg-primary/20 hover:text-primary">
              <User className="h-4 w-4" />
              Account
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="dark:bg-[#151515] dark:border-primary/20">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="dark:bg-muted" />
            <DropdownMenuItem className="gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 focus:bg-primary/10 focus:text-primary cursor-pointer">
              <Bell className="h-4 w-4" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuSeparator className="dark:bg-primary/20" />
            <DropdownMenuItem className="gap-2 focus:bg-destructive/10 focus:text-destructive cursor-pointer">
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      {/* Progress and Loading */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Progress Indicators</h2>
        <div className="space-y-4">
          <Progress value={60} className="w-[60%] dark:bg-primary/10" />
          <div className="flex gap-4">
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Please wait
            </Button>
            <Button variant="outline" disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </Button>
          </div>
        </div>
      </section>

      {/* Radio Group and Switch */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Selection Controls</h2>
        <div className="flex gap-8">
          <div className="space-y-4">
            <Label>Notification Method</Label>
            <RadioGroup defaultValue="email">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" className="border-primary/40 text-primary" />
                <Label htmlFor="email" className="cursor-pointer">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="sms" className="border-primary/40 text-primary" />
                <Label htmlFor="sms" className="cursor-pointer">SMS</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <Label>Preferences</Label>
            <div className="flex items-center space-x-2">
              <Switch id="notifications" className="data-[state=checked]:bg-primary" />
              <Label htmlFor="notifications" className="cursor-pointer">Enable Notifications</Label>
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Data Table</h2>
        <div className="rounded-md border dark:border-primary/20">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-primary/20 hover:bg-primary/5">
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="dark:border-primary/20 hover:bg-primary/5">
                <TableCell>John Doe</TableCell>
                <TableCell><Badge variant="default">Active</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive">
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="dark:border-primary/20 hover:bg-primary/5">
                <TableCell>Jane Smith</TableCell>
                <TableCell><Badge variant="secondary">Inactive</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive">
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Textarea and Toggle */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Input Controls</h2>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              placeholder="Write something about yourself..."
              className="dark:bg-[#151515] dark:border-primary/20 hover:dark:border-primary/40 focus:dark:border-primary dark:focus:shadow-neon/20"
            />
          </div>
          <div className="flex items-center gap-4">
            <Toggle className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary">
              <Star className="h-4 w-4 mr-2" />
              Favorite
            </Toggle>
            <Toggle className="data-[state=on]:bg-primary/20 data-[state=on]:text-primary">
              <Heart className="h-4 w-4 mr-2" />
              Like
            </Toggle>
          </div>
        </div>
      </section>

      {/* Slider */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Range Slider</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Volume</Label>
            <Slider 
              defaultValue={[50]} 
              max={100} 
              step={1}
              className="w-[60%] [&>[role=slider]]:bg-primary [&>[role=slider]]:border-primary/40 [&>[role=slider]]:shadow-neon/20"
            />
          </div>
        </div>
      </section>

      {/* Scroll Area */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Scroll Area</h2>
        <ScrollArea className="h-[200px] w-[350px] rounded-md border dark:border-primary/20 p-4">
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2 rounded-lg hover:bg-primary/5">
                <FileText className="h-4 w-4 text-primary/60" />
                <div>
                  <div className="font-medium">Document {i + 1}</div>
                  <div className="text-sm text-muted-foreground">PDF • 2.3MB</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </section>

      {/* Dialog */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 hover:bg-primary-dark">
              <Image className="h-4 w-4" />
              Create New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gradient-to-br dark:from-[#1A2E2E] dark:to-[#141414]">
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
              <DialogDescription>
                Share your thoughts with the community.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title"
                  className="dark:bg-[#151515] dark:border-primary/20 focus:dark:border-primary/40 focus:outline-none focus:ring-0 focus:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your post content..."
                  className="dark:bg-[#151515] dark:border-primary/20 focus:dark:border-primary/40 focus:outline-none focus:ring-0 focus:ring-offset-0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="gap-2 hover:bg-primary/20 hover:text-primary">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button className="gap-2 hover:bg-primary-dark">
                <Check className="h-4 w-4" />
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Search with Command */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Search</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10 dark:bg-[#151515] dark:border-primary/20 focus:dark:border-primary/40 focus:outline-none focus:ring-0 focus:ring-offset-0"
          />
        </div>
      </section>

    </div>
  )
} 
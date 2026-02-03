# UI Kit Usage Guide

This document provides usage patterns for the common UI components.

## Button

```tsx
import { Button, ButtonGroup } from '@/components/ui';

// Basic variants
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// With icons
<Button leftIcon={<PlusIcon />}>Add Item</Button>
<Button rightIcon={<ArrowRightIcon />}>Continue</Button>

// Loading state
<Button isLoading>Saving...</Button>

// Button group
<ButtonGroup>
  <Button>Option A</Button>
  <Button>Option B</Button>
</ButtonGroup>
```

## Badge

```tsx
import { Badge, Tag, StatusIndicator } from '@/components/ui';

// Badge variants
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>

// Removable tag
<Tag onRemove={() => {}}>Removable</Tag>

// Status indicator
<StatusIndicator status="online" />
<StatusIndicator status="busy" size="lg" />
```

## Input & Textarea

```tsx
import { Input, Textarea, InputGroup } from '@/components/ui';

// Basic input
<Input placeholder="Enter text..." />
<Input type="email" placeholder="Email" />
<Input variant="error" placeholder="Invalid input" />

// Input sizes
<Input inputSize="sm" placeholder="Small" />
<Input inputSize="lg" placeholder="Large" />

// Input with addon
<InputGroup leftAddon="https://">
  <Input placeholder="example.com" />
</InputGroup>

// Input with icon
<InputGroup leftElement={<SearchIcon />}>
  <Input placeholder="Search..." />
</InputGroup>

// Textarea
<Textarea placeholder="Enter description..." minRows={4} />
```

## Form Field

```tsx
import { FormField, FormSection, FormActions, Input, Button } from '@/components/ui';

<FormSection title="Personal Information" description="Enter your details">
  <FormField label="Full Name" required error={errors.name}>
    <Input placeholder="John Doe" />
  </FormField>
  
  <FormField label="Email" helperText="We'll never share your email">
    <Input type="email" placeholder="john@example.com" />
  </FormField>
</FormSection>

<FormActions align="right">
  <Button variant="outline">Cancel</Button>
  <Button>Submit</Button>
</FormActions>
```

## Select

```tsx
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

## Checkbox, Radio, Switch

```tsx
import { Checkbox, RadioGroup, RadioGroupItem, Switch } from '@/components/ui';

// Checkbox
<Checkbox label="Accept terms" />
<Checkbox checked={true} onCheckedChange={setChecked} />

// Radio group
<RadioGroup value={value} onValueChange={setValue}>
  <RadioGroupItem value="a" label="Option A" />
  <RadioGroupItem value="b" label="Option B" />
</RadioGroup>

// Switch
<Switch label="Enable notifications" description="Receive email updates" />
```

## Dialog

```tsx
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Button
} from '@/components/ui';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Drawer

```tsx
import {
  Drawer, DrawerTrigger, DrawerContent, DrawerHeader,
  DrawerTitle, DrawerDescription, Button
} from '@/components/ui';

<Drawer>
  <DrawerTrigger asChild>
    <Button>Open Drawer</Button>
  </DrawerTrigger>
  <DrawerContent side="right">
    <DrawerHeader>
      <DrawerTitle>Settings</DrawerTitle>
      <DrawerDescription>Adjust your preferences</DrawerDescription>
    </DrawerHeader>
    {/* Content */}
  </DrawerContent>
</Drawer>
```

## DropdownMenu

```tsx
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, Button
} from '@/components/ui';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Tooltip

```tsx
import { SimpleTooltip, TooltipProvider } from '@/components/ui';

// Wrap app with TooltipProvider
<TooltipProvider>
  <App />
</TooltipProvider>

// Use SimpleTooltip for common cases
<SimpleTooltip content="View details">
  <Button variant="ghost" size="icon">
    <InfoIcon />
  </Button>
</SimpleTooltip>
```

## Table

```tsx
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@/components/ui';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell><Badge variant="success">Active</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Pagination

```tsx
import { Pagination, PaginationInfo } from '@/components/ui';

<div className="flex items-center justify-between">
  <PaginationInfo page={1} pageSize={10} totalItems={100} />
  <Pagination
    page={1}
    totalPages={10}
    onPageChange={setPage}
  />
</div>
```

## Skeleton

```tsx
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from '@/components/ui';

// Basic skeleton
<Skeleton className="h-4 w-full" />
<Skeleton className="h-10 w-10 rounded-full" />

// Text skeleton
<SkeletonText lines={3} />

// Card skeleton
<SkeletonCard showAvatar />

// Table skeleton
<SkeletonTable rows={5} columns={4} />
```

## Toast

```tsx
import { Toaster, toastSuccess, toastError, toastPromise } from '@/components/ui';

// Add Toaster to app root
<Toaster />

// Show toasts
toastSuccess('Saved successfully!');
toastError('Something went wrong');

// Promise toast
toastPromise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save',
});
```

## DatePicker

```tsx
import { DatePicker } from '@/components/ui';

<DatePicker
  value={date}
  onChange={setDate}
  placeholder="Select date"
/>
```

## Card

```tsx
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

## Accessibility

All components include:
- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader compatibility

Use the `focusRing` and `focusRingInput` tokens for consistent focus styles.

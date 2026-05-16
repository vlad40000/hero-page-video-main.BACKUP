import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Truck,
    ArrowRightLeft,
    PackageMinus,
    Wrench,
    Building2,
    HelpCircle
} from "lucide-react";

export const metadata: Metadata = {
    title: 'Place Order | Road Runner Inc Appliance',
    description: 'Central hub for delivery, relocation, pickup, and maintenance requests.',
};

export default function PlaceOrderPage() {
    return (
        <>
            <div className="py-12 md:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
                            Request <span className="text-blue-600">Hub</span>
                        </h1>
                        <p className="text-lg text-slate-500">
                            Submit your service requests, manage your account, or get in touch.
                        </p>
                    </div>

                    <Tabs defaultValue="delivery" className="w-full">
                        <div className="flex justify-center mb-8 overflow-x-auto pb-4 md:pb-0">
                            <TabsList className="bg-white p-1 rounded-full shadow-sm border border-slate-200 h-auto flex-wrap justify-center min-w-max">
                                <TabsTrigger value="delivery" className="rounded-full px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                    <Truck className="w-4 h-4 mr-2" /> Delivery
                                </TabsTrigger>
                                <TabsTrigger value="relocate" className="rounded-full px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                    <ArrowRightLeft className="w-4 h-4 mr-2" /> Relocate
                                </TabsTrigger>
                                <TabsTrigger value="pickup" className="rounded-full px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                    <PackageMinus className="w-4 h-4 mr-2" /> Pickup
                                </TabsTrigger>
                                <TabsTrigger value="service" className="rounded-full px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                    <Wrench className="w-4 h-4 mr-2" /> Maintenance
                                </TabsTrigger>
                                <TabsTrigger value="corporate" className="rounded-full px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                    <Building2 className="w-4 h-4 mr-2" /> Corporate
                                </TabsTrigger>
                                <TabsTrigger value="other" className="rounded-full px-6 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                    <HelpCircle className="w-4 h-4 mr-2" /> Other
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Request for Delivery */}
                        <TabsContent value="delivery">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-blue-600 text-white rounded-t-xl p-8">
                                    <CardTitle className="text-2xl">Request for Delivery</CardTitle>
                                    <CardDescription className="text-blue-100">Schedule a new appliance delivery.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="del-name">Full Name</Label>
                                            <Input id="del-name" placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="del-phone">Phone Number</Label>
                                            <Input id="del-phone" placeholder="(555) 123-4567" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="del-email">Email Address</Label>
                                            <Input id="del-email" type="email" placeholder="john@example.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="del-date">Preferred Date</Label>
                                            <Input id="del-date" type="date" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="del-address">Delivery Address</Label>
                                        <Input id="del-address" placeholder="123 Main St, Apt 4B" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="del-notes">Product Selection / Notes</Label>
                                        <Textarea id="del-notes" placeholder="I'm interested in the Large Capacity Washer & Dryer set..." />
                                    </div>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6">Submit Delivery Request</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Request to Relocate */}
                        <TabsContent value="relocate">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-slate-800 text-white rounded-t-xl p-8">
                                    <CardTitle className="text-2xl">Request to Relocate Machines</CardTitle>
                                    <CardDescription className="text-slate-300">Moving units from one unit/property to another.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="rel-name">Contact Name</Label>
                                            <Input id="rel-name" placeholder="Property Manager" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rel-phone">Phone Number</Label>
                                            <Input id="rel-phone" placeholder="(555) 123-4567" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rel-current">Current Location (From)</Label>
                                        <Input id="rel-current" placeholder="Unit 101" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rel-new">New Location (To)</Label>
                                        <Input id="rel-new" placeholder="Unit 205" />
                                    </div>
                                    <Button className="w-full bg-slate-800 hover:bg-slate-900 text-lg py-6">Request Relocation</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Request for Pickup */}
                        <TabsContent value="pickup">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-red-600 text-white rounded-t-xl p-8">
                                    <CardTitle className="text-2xl">Request for Pickup</CardTitle>
                                    <CardDescription className="text-red-100">Schedule a pickup to end your lease.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="pick-name">Full Name</Label>
                                            <Input id="pick-name" placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pick-date">Pickup Date</Label>
                                            <Input id="pick-date" type="date" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pick-address">Pickup Address</Label>
                                        <Input id="pick-address" placeholder="123 Main St, Apt 4B" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pick-reason">Reason for Return</Label>
                                        <Input id="pick-reason" placeholder="Moving out, upgrade, etc." />
                                    </div>
                                    <Button className="w-full bg-red-600 hover:bg-red-700 text-lg py-6">Schedule Pickup</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Request for Maintenance */}
                        <TabsContent value="service">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-orange-500 text-white rounded-t-xl p-8">
                                    <CardTitle className="text-2xl">Request for Maintenance</CardTitle>
                                    <CardDescription className="text-orange-100">Report an issue with your machine.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="svc-name">Full Name</Label>
                                            <Input id="svc-name" placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="svc-phone">Phone Number</Label>
                                            <Input id="svc-phone" placeholder="(555) 123-4567" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="svc-address">Service Address</Label>
                                        <Input id="svc-address" placeholder="123 Main St, Apt 4B" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="svc-issue">Issue Description</Label>
                                        <Textarea id="svc-issue" placeholder="Washer is not draining..." className="min-h-[100px]" />
                                    </div>
                                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6">Request Service</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Corporate Direct Login */}
                        <TabsContent value="corporate">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-slate-900 text-white rounded-t-xl p-8">
                                    <CardTitle className="text-2xl">Corporate Direct Login</CardTitle>
                                    <CardDescription className="text-slate-400">Access your property management dashboard.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="corp-email">Corporate Email</Label>
                                        <Input id="corp-email" type="email" placeholder="manager@company.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="corp-pass">Password</Label>
                                        <Input id="corp-pass" type="password" />
                                    </div>
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-lg py-6">Login to Dashboard</Button>
                                    <p className="text-center text-sm text-slate-500">
                                        Don&apos;t have an account? <a href="/corporate" className="text-blue-600 underline">Contact Sales</a>
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Other Inquiries */}
                        <TabsContent value="other">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="bg-slate-100 text-slate-900 rounded-t-xl p-8">
                                    <CardTitle className="text-2xl">Other Inquiries</CardTitle>
                                    <CardDescription>General questions and support.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="oth-name">Full Name</Label>
                                            <Input id="oth-name" placeholder="John Doe" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="oth-email">Email Address</Label>
                                            <Input id="oth-email" type="email" placeholder="john@example.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="oth-msg">Message</Label>
                                        <Textarea id="oth-msg" placeholder="How can we help you?" className="min-h-[150px]" />
                                    </div>
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-lg py-6">Send Message</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </div>
            </div>
        </>
    );
}

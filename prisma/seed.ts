import { PrismaClient, Plan, UserRole, ProjectStatus, FinancialType, FinancialStatus, ServiceOrderStatus, Priority, EmployeeStatus, StockMovementType, VehicleType, VehicleStatus, ClientType, CategoryType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.vehicleFueling.deleteMany();
  await prisma.vehicleMaintenance.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.serviceOrderMaterial.deleteMany();
  await prisma.serviceOrderChecklist.deleteMany();
  await prisma.serviceOrderPhoto.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.employeePayment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.material.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.financialEntry.deleteMany();
  await prisma.financialCategory.deleteMany();
  await prisma.projectTimeline.deleteMany();
  await prisma.projectDiary.deleteMany();
  await prisma.projectNote.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.projectPhoto.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: "Construtora Smart Ltda",
      cnpj: "12345678000199",
      phone: "11999998888",
      email: "contato@smartobra.com",
      address: "Rua das Construcoes, 100 - Sao Paulo/SP",
      plan: Plan.PRO,
      active: true,
    },
  });

  const passwordHash = await hash("smart123", 10);

  const admin = await prisma.user.create({
    data: { name: "Carlos Admin", email: "admin@smartobra.com", password: passwordHash, phone: "11999990001", role: UserRole.ADMIN, companyId: company.id },
  });

  await prisma.user.create({
    data: { name: "Ana Financeiro", email: "financeiro@smartobra.com", password: passwordHash, phone: "11999990002", role: UserRole.FINANCEIRO, companyId: company.id },
  });

  await prisma.user.create({
    data: { name: "Roberto Gestor", email: "gestor@smartobra.com", password: passwordHash, phone: "11999990003", role: UserRole.GESTOR, companyId: company.id },
  });

  await prisma.user.create({
    data: { name: "Jose Tecnico", email: "tecnico1@smartobra.com", password: passwordHash, phone: "11999990004", role: UserRole.TECNICO, companyId: company.id },
  });

  await prisma.user.create({
    data: { name: "Pedro Tecnico", email: "tecnico2@smartobra.com", password: passwordHash, phone: "11999990005", role: UserRole.TECNICO, companyId: company.id },
  });

  const client1 = await prisma.client.create({
    data: { name: "Joao Silva", cpfCnpj: "12345678901", phone: "11988887777", email: "joao@email.com", address: "Av. Paulista, 1000 - Sao Paulo/SP", type: ClientType.PERSON, companyId: company.id },
  });

  const client2 = await prisma.client.create({
    data: { name: "Maria Santos Empreendimentos", cpfCnpj: "98765432000188", phone: "11977776666", email: "maria@santos.com", address: "Rua Augusta, 500 - Sao Paulo/SP", type: ClientType.COMPANY, companyId: company.id },
  });

  const client3 = await prisma.client.create({
    data: { name: "Pedro Lima", cpfCnpj: "98765432100", phone: "11966665555", email: "pedro@email.com", address: "Rua Oscar Freire, 200 - Sao Paulo/SP", type: ClientType.PERSON, companyId: company.id },
  });

  const project1 = await prisma.project.create({
    data: { name: "Residencial Vista Mar", clientId: client1.id, address: "Rua da Praia, 500 - Guaruja/SP", startDate: new Date("2024-01-15"), expectedEndDate: new Date("2024-08-30"), status: ProjectStatus.IN_PROGRESS, budget: 450000, actualCost: 320000, progress: 75, description: "Construcao residencial de alto padrao com vista para o mar", companyId: company.id },
  });

  const project2 = await prisma.project.create({
    data: { name: "Reforma Comercial Center", clientId: client2.id, address: "Av. Faria Lima, 1500 - Sao Paulo/SP", startDate: new Date("2024-03-01"), expectedEndDate: new Date("2024-09-30"), status: ProjectStatus.IN_PROGRESS, budget: 280000, actualCost: 125000, progress: 45, description: "Reforma completa de espaco comercial de 500m2", companyId: company.id },
  });

  const project3 = await prisma.project.create({
    data: { name: "Edificio Solaris", clientId: client3.id, address: "Rua Sol Nascente, 100 - Campinas/SP", startDate: new Date("2023-06-01"), expectedEndDate: new Date("2024-02-28"), actualEndDate: new Date("2024-03-15"), status: ProjectStatus.COMPLETED, budget: 1200000, actualCost: 1180000, progress: 100, description: "Edificio residencial de 8 andares", companyId: company.id },
  });

  await prisma.project.create({
    data: { name: "Casa Praia Norte", clientId: client1.id, address: "Condominio Praia Norte, Lote 15 - Ubatuba/SP", startDate: new Date("2024-06-01"), expectedEndDate: new Date("2024-12-31"), status: ProjectStatus.PLANNING, budget: 350000, actualCost: 0, progress: 10, description: "Casa de veraneio em condominio fechado", companyId: company.id },
  });

  const supplier1 = await prisma.supplier.create({ data: { name: "Cimento Nacional Ltda", cnpj: "11222333000144", phone: "1133334444", companyId: company.id } });
  const supplier2 = await prisma.supplier.create({ data: { name: "Ferro e Aco Sao Paulo", cnpj: "22333444000155", phone: "1144445555", companyId: company.id } });
  const supplier3 = await prisma.supplier.create({ data: { name: "Madeireira Bom Preco", cnpj: "33444555000166", phone: "1155556666", companyId: company.id } });
  const supplier4 = await prisma.supplier.create({ data: { name: "Eletrica Total", cnpj: "44555666000177", phone: "1166667777", companyId: company.id } });
  const supplier5 = await prisma.supplier.create({ data: { name: "Hidraulica Express", cnpj: "55666777000188", phone: "1177778888", companyId: company.id } });

  await Promise.all([
    prisma.material.create({ data: { name: "Cimento CP-II 50kg", code: "CIM001", unit: "saco", minQuantity: 50, currentQuantity: 120, unitPrice: 38.90, supplierId: supplier1.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Areia Media m3", code: "ARE001", unit: "m3", minQuantity: 10, currentQuantity: 25, unitPrice: 120.00, supplierId: supplier1.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Brita 1 m3", code: "BRI001", unit: "m3", minQuantity: 10, currentQuantity: 18, unitPrice: 95.00, supplierId: supplier1.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Vergalhao 10mm (12m)", code: "VER001", unit: "barra", minQuantity: 100, currentQuantity: 80, unitPrice: 45.50, supplierId: supplier2.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Vergalhao 8mm (12m)", code: "VER002", unit: "barra", minQuantity: 80, currentQuantity: 60, unitPrice: 32.00, supplierId: supplier2.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Tijolo Ceramico 9x19x29", code: "TIJ001", unit: "milheiro", minQuantity: 5, currentQuantity: 8, unitPrice: 850.00, supplierId: supplier1.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Tabua Pinus 3m", code: "MAD001", unit: "unid", minQuantity: 50, currentQuantity: 35, unitPrice: 28.00, supplierId: supplier3.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Compensado 15mm", code: "MAD002", unit: "chapa", minQuantity: 20, currentQuantity: 15, unitPrice: 89.00, supplierId: supplier3.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Fio 2.5mm Azul (100m)", code: "ELE001", unit: "rolo", minQuantity: 10, currentQuantity: 12, unitPrice: 185.00, supplierId: supplier4.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Fio 4.0mm Preto (100m)", code: "ELE002", unit: "rolo", minQuantity: 8, currentQuantity: 6, unitPrice: 280.00, supplierId: supplier4.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Tubo PVC 100mm (6m)", code: "HID001", unit: "barra", minQuantity: 20, currentQuantity: 30, unitPrice: 52.00, supplierId: supplier5.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Tubo PVC 50mm (6m)", code: "HID002", unit: "barra", minQuantity: 15, currentQuantity: 22, unitPrice: 28.00, supplierId: supplier5.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Telha Ceramica", code: "TEL001", unit: "milheiro", minQuantity: 3, currentQuantity: 2, unitPrice: 1200.00, supplierId: supplier1.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Cal Hidratada 20kg", code: "CAL001", unit: "saco", minQuantity: 30, currentQuantity: 45, unitPrice: 18.50, supplierId: supplier1.id, companyId: company.id } }),
    prisma.material.create({ data: { name: "Prego 18x27 (1kg)", code: "PRE001", unit: "kg", minQuantity: 20, currentQuantity: 35, unitPrice: 22.00, supplierId: supplier2.id, companyId: company.id } }),
  ]);

  const employees = await Promise.all([
    prisma.employee.create({ data: { name: "Antonio Pedreiro", cpf: "11111111111", role: "Pedreiro", phone: "11900001111", salary: 3500, hireDate: new Date("2022-03-01"), status: EmployeeStatus.ACTIVE, companyId: company.id } }),
    prisma.employee.create({ data: { name: "Marcos Eletricista", cpf: "22222222222", role: "Eletricista", phone: "11900002222", salary: 4000, hireDate: new Date("2022-05-15"), status: EmployeeStatus.ACTIVE, companyId: company.id } }),
    prisma.employee.create({ data: { name: "Rafael Encanador", cpf: "33333333333", role: "Encanador", phone: "11900003333", salary: 3800, hireDate: new Date("2023-01-10"), status: EmployeeStatus.ACTIVE, companyId: company.id } }),
    prisma.employee.create({ data: { name: "Lucas Servente", cpf: "44444444444", role: "Servente", phone: "11900004444", salary: 2200, hireDate: new Date("2023-03-20"), status: EmployeeStatus.ACTIVE, companyId: company.id } }),
    prisma.employee.create({ data: { name: "Fernando Pintor", cpf: "55555555555", role: "Pintor", phone: "11900005555", salary: 3200, hireDate: new Date("2022-08-01"), status: EmployeeStatus.ACTIVE, companyId: company.id } }),
    prisma.employee.create({ data: { name: "Gabriel Carpinteiro", cpf: "66666666666", role: "Carpinteiro", phone: "11900006666", salary: 3800, hireDate: new Date("2022-11-01"), status: EmployeeStatus.ACTIVE, companyId: company.id } }),
    prisma.employee.create({ data: { name: "Diego Azulejista", cpf: "77777777777", role: "Azulejista", phone: "11900007777", salary: 3600, hireDate: new Date("2023-06-01"), status: EmployeeStatus.ACTIVE, companyId: company.id } }),
    prisma.employee.create({ data: { name: "Henrique Mestre de Obras", cpf: "88888888888", role: "Mestre de Obras", phone: "11900008888", salary: 5500, hireDate: new Date("2021-01-15"), status: EmployeeStatus.ACTIVE, companyId: company.id } }),
    prisma.employee.create({ data: { name: "Bruno Servente", cpf: "99999999999", role: "Servente", phone: "11900009999", salary: 2200, hireDate: new Date("2023-09-01"), status: EmployeeStatus.ACTIVE, companyId: company.id } }),
    prisma.employee.create({ data: { name: "Thiago Soldador", cpf: "10101010101", role: "Soldador", phone: "11900010101", salary: 4200, hireDate: new Date("2023-02-01"), status: EmployeeStatus.VACATION, companyId: company.id } }),
  ]);

  await prisma.financialCategory.createMany({
    data: [
      { name: "Material de Construcao", type: CategoryType.EXPENSE, companyId: company.id },
      { name: "Mao de Obra", type: CategoryType.EXPENSE, companyId: company.id },
      { name: "Aluguel de Equipamento", type: CategoryType.EXPENSE, companyId: company.id },
      { name: "Transporte", type: CategoryType.EXPENSE, companyId: company.id },
      { name: "Pagamento de Obra", type: CategoryType.INCOME, companyId: company.id },
      { name: "Servico Avulso", type: CategoryType.INCOME, companyId: company.id },
    ],
  });

  const financialData = [
    { type: FinancialType.RECEIVABLE, description: "Parcela 1/6 - Residencial Vista Mar", value: 75000, dueDate: new Date("2024-02-15"), paidDate: new Date("2024-02-14"), status: FinancialStatus.PAID, category: "Pagamento de Obra", projectId: project1.id },
    { type: FinancialType.RECEIVABLE, description: "Parcela 2/6 - Residencial Vista Mar", value: 75000, dueDate: new Date("2024-03-15"), paidDate: new Date("2024-03-15"), status: FinancialStatus.PAID, category: "Pagamento de Obra", projectId: project1.id },
    { type: FinancialType.RECEIVABLE, description: "Parcela 3/6 - Residencial Vista Mar", value: 75000, dueDate: new Date("2024-04-15"), paidDate: new Date("2024-04-16"), status: FinancialStatus.PAID, category: "Pagamento de Obra", projectId: project1.id },
    { type: FinancialType.RECEIVABLE, description: "Parcela 4/6 - Residencial Vista Mar", value: 75000, dueDate: new Date("2024-05-15"), status: FinancialStatus.PENDING, category: "Pagamento de Obra", projectId: project1.id },
    { type: FinancialType.RECEIVABLE, description: "Parcela 1/4 - Reforma Comercial", value: 70000, dueDate: new Date("2024-03-30"), paidDate: new Date("2024-03-29"), status: FinancialStatus.PAID, category: "Pagamento de Obra", projectId: project2.id },
    { type: FinancialType.RECEIVABLE, description: "Parcela 2/4 - Reforma Comercial", value: 70000, dueDate: new Date("2024-05-30"), status: FinancialStatus.PENDING, category: "Pagamento de Obra", projectId: project2.id },
    { type: FinancialType.RECEIVABLE, description: "OS #001 - Manutencao", value: 2500, dueDate: new Date("2024-04-10"), paidDate: new Date("2024-04-10"), status: FinancialStatus.PAID, category: "Servico Avulso" },
    { type: FinancialType.PAYABLE, description: "Cimento - 200 sacos", value: 7780, dueDate: new Date("2024-03-20"), paidDate: new Date("2024-03-20"), status: FinancialStatus.PAID, category: "Material de Construcao", projectId: project1.id },
    { type: FinancialType.PAYABLE, description: "Vergalhoes - Lote", value: 12500, dueDate: new Date("2024-03-25"), paidDate: new Date("2024-03-25"), status: FinancialStatus.PAID, category: "Material de Construcao", projectId: project1.id },
    { type: FinancialType.PAYABLE, description: "Folha de Pagamento - Marco", value: 35000, dueDate: new Date("2024-04-05"), paidDate: new Date("2024-04-05"), status: FinancialStatus.PAID, category: "Mao de Obra" },
    { type: FinancialType.PAYABLE, description: "Folha de Pagamento - Abril", value: 35000, dueDate: new Date("2024-05-05"), status: FinancialStatus.PENDING, category: "Mao de Obra" },
    { type: FinancialType.PAYABLE, description: "Aluguel Betoneira", value: 1500, dueDate: new Date("2024-04-10"), paidDate: new Date("2024-04-10"), status: FinancialStatus.PAID, category: "Aluguel de Equipamento", projectId: project1.id },
    { type: FinancialType.PAYABLE, description: "Material Eletrico - Reforma", value: 8500, dueDate: new Date("2024-04-15"), status: FinancialStatus.PENDING, category: "Material de Construcao", projectId: project2.id },
    { type: FinancialType.PAYABLE, description: "Frete de Material", value: 2200, dueDate: new Date("2024-04-08"), paidDate: new Date("2024-04-08"), status: FinancialStatus.PAID, category: "Transporte", projectId: project1.id },
    { type: FinancialType.PAYABLE, description: "Madeiramento - Telhado", value: 15000, dueDate: new Date("2024-04-20"), status: FinancialStatus.PENDING, category: "Material de Construcao", projectId: project1.id },
    { type: FinancialType.RECEIVABLE, description: "Saldo Final - Edificio Solaris", value: 120000, dueDate: new Date("2024-03-30"), paidDate: new Date("2024-04-02"), status: FinancialStatus.PAID, category: "Pagamento de Obra", projectId: project3.id },
    { type: FinancialType.PAYABLE, description: "Tubulacoes PVC", value: 3200, dueDate: new Date("2024-04-25"), status: FinancialStatus.PENDING, category: "Material de Construcao", projectId: project2.id },
    { type: FinancialType.PAYABLE, description: "Combustivel - Frota", value: 4500, dueDate: new Date("2024-04-30"), status: FinancialStatus.PENDING, category: "Transporte" },
    { type: FinancialType.RECEIVABLE, description: "Medicao Extra - Residencial", value: 25000, dueDate: new Date("2024-05-20"), status: FinancialStatus.PENDING, category: "Pagamento de Obra", projectId: project1.id },
    { type: FinancialType.PAYABLE, description: "Aluguel Andaimes", value: 3800, dueDate: new Date("2024-05-01"), status: FinancialStatus.OVERDUE, category: "Aluguel de Equipamento", projectId: project2.id },
  ];

  for (const entry of financialData) {
    await prisma.financialEntry.create({ data: { ...entry, companyId: company.id } });
  }

  await prisma.serviceOrder.create({ data: { clientId: client1.id, projectId: project1.id, technicianId: employees[1].id, type: "Instalacao Eletrica", priority: Priority.HIGH, status: ServiceOrderStatus.IN_PROGRESS, description: "Instalacao do quadro eletrico principal e circuitos do 2o pavimento", scheduledDate: new Date("2024-04-15"), startedAt: new Date("2024-04-15"), value: 4500, companyId: company.id } });
  await prisma.serviceOrder.create({ data: { clientId: client2.id, projectId: project2.id, technicianId: employees[2].id, type: "Instalacao Hidraulica", priority: Priority.MEDIUM, status: ServiceOrderStatus.OPEN, description: "Instalacao de tubulacao de agua fria e quente nos banheiros", scheduledDate: new Date("2024-04-20"), value: 3200, companyId: company.id } });
  await prisma.serviceOrder.create({ data: { clientId: client1.id, technicianId: employees[0].id, type: "Manutencao", priority: Priority.LOW, status: ServiceOrderStatus.COMPLETED, description: "Reparo em muro de divisa com trinca", scheduledDate: new Date("2024-04-05"), startedAt: new Date("2024-04-05"), completedAt: new Date("2024-04-06"), value: 2500, companyId: company.id } });
  await prisma.serviceOrder.create({ data: { clientId: client3.id, technicianId: employees[4].id, type: "Pintura", priority: Priority.MEDIUM, status: ServiceOrderStatus.WAITING_MATERIAL, description: "Pintura interna de apartamento - 3 quartos, sala e cozinha", scheduledDate: new Date("2024-04-22"), value: 5800, observations: "Aguardando tinta especial cor personalizada", companyId: company.id } });
  await prisma.serviceOrder.create({ data: { clientId: client2.id, projectId: project2.id, technicianId: employees[5].id, type: "Carpintaria", priority: Priority.URGENT, status: ServiceOrderStatus.OPEN, description: "Instalacao de forro de madeira na area de recepcao", scheduledDate: new Date("2024-04-18"), value: 8500, companyId: company.id } });

  await prisma.vehicle.create({ data: { name: "Caminhonete Obra 01", plate: "ABC-1234", type: VehicleType.TRUCK, brand: "Toyota", model: "Hilux", year: 2022, km: 45000, status: VehicleStatus.ACTIVE, companyId: company.id } });
  await prisma.vehicle.create({ data: { name: "Furgao Materiais", plate: "DEF-5678", type: VehicleType.TRUCK, brand: "Fiat", model: "Ducato", year: 2021, km: 62000, status: VehicleStatus.ACTIVE, companyId: company.id } });
  await prisma.vehicle.create({ data: { name: "Retroescavadeira", type: VehicleType.MACHINE, brand: "JCB", model: "3CX", year: 2020, hourMeter: 3200, status: VehicleStatus.MAINTENANCE, companyId: company.id } });

  console.log("Seed completed successfully!");
  console.log("Admin login: admin@smartobra.com / smart123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
